// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Native MON principal held per immutable business intent. Not a delivery oracle.
contract PurserRelay {
    enum Status { None, Active, Paid, Cancelled }
    struct Order {
        address owner; bytes32 intent; bytes32 requestHash; address payable seller;
        uint256 amount; uint256 balance; uint64 expiry; uint64 createdBlock;
        uint64 paidBlock; address winner; Status status; address[2] workers;
    }
    mapping(bytes32 => Order) private orders;
    mapping(address => mapping(bytes32 => bytes32)) public orderForIntent;
    mapping(bytes32 => mapping(address => bool)) public allowed;
    mapping(bytes32 => mapping(address => bool)) public everAuthorized;
    bool private entered;
    error DuplicateIntent(); error Invalid(); error Unauthorized(); error State(); error TransferFailed(); error Reentry();
    event OrderCreated(bytes32 indexed orderId, address indexed owner, bytes32 indexed intent, bytes32 requestHash, address seller, uint256 amount, uint64 expiry);
    event OrderPaid(bytes32 indexed orderId, bytes32 requestHash, address seller, uint256 amount, address winner);
    event OrderCancelled(bytes32 indexed orderId, address owner, uint256 amount);
    event WorkerRevoked(bytes32 indexed orderId, address worker);
    event WorkerReplaced(bytes32 indexed orderId, address oldWorker, address newWorker);
    modifier guard() { if (entered) revert Reentry(); entered=true; _; entered=false; }
    function createOrder(bytes32 intent, bytes32 requestHash, address payable seller, uint256 amount, uint64 expiry, address a, address b) external payable guard returns(bytes32 id) {
        if(intent==0 || requestHash==0 || seller==address(0) || seller==address(this) || amount==0 || msg.value!=amount || expiry<=block.timestamp || a==address(0) || b==address(0) || a==b) revert Invalid();
        if(orderForIntent[msg.sender][intent]!=0) revert DuplicateIntent();
        id=keccak256(abi.encode(block.chainid,address(this),msg.sender,intent));
        orderForIntent[msg.sender][intent]=id;
        Order storage o=orders[id]; o.owner=msg.sender; o.intent=intent; o.requestHash=requestHash; o.seller=seller; o.amount=amount; o.balance=amount; o.expiry=expiry; o.createdBlock=uint64(block.number); o.status=Status.Active; o.workers=[a,b];
        allowed[id][a]=true;allowed[id][b]=true;everAuthorized[id][a]=true;everAuthorized[id][b]=true;
        emit OrderCreated(id,msg.sender,intent,requestHash,seller,amount,expiry);
    }
    function consumeOrder(bytes32 id, bytes32 requestHash) external guard {
        Order storage o=orders[id];
        if(!allowed[id][msg.sender]) revert Unauthorized();
        if(o.status!=Status.Active || block.timestamp>=o.expiry || o.balance!=o.amount) revert State();
        if(o.requestHash!=requestHash) revert Invalid();
        o.status=Status.Paid;o.winner=msg.sender;o.paidBlock=uint64(block.number);o.balance=0;
        (bool ok,)=o.seller.call{value:o.amount}("");if(!ok) revert TransferFailed();
        emit OrderPaid(id,o.requestHash,o.seller,o.amount,msg.sender);
    }
    function cancel(bytes32 id) external guard {
        Order storage o=orders[id];if(msg.sender!=o.owner) revert Unauthorized();
        if(o.status!=Status.Active || block.timestamp<o.expiry) revert State();
        o.status=Status.Cancelled;o.balance=0;
        (bool ok,)=payable(o.owner).call{value:o.amount}("");if(!ok) revert TransferFailed();
        emit OrderCancelled(id,o.owner,o.amount);
    }
    function revokeWorker(bytes32 id,address worker) external guard {
        Order storage o=orders[id];if(msg.sender!=o.owner) revert Unauthorized();
        if(o.status!=Status.Active || !allowed[id][worker]) revert State();
        allowed[id][worker]=false;emit WorkerRevoked(id,worker);
    }
    function replaceWorker(bytes32 id,address oldWorker,address newWorker) external guard {
        Order storage o=orders[id];if(msg.sender!=o.owner) revert Unauthorized();
        if(o.status!=Status.Active || block.timestamp>=o.expiry || !allowed[id][oldWorker]) revert State();
        if(newWorker==address(0) || everAuthorized[id][newWorker]) revert Invalid();
        uint256 slot;
        if(o.workers[0]==oldWorker) slot=0;else if(o.workers[1]==oldWorker) slot=1;else revert State();
        allowed[id][oldWorker]=false;o.workers[slot]=newWorker;allowed[id][newWorker]=true;everAuthorized[id][newWorker]=true;
        emit WorkerReplaced(id,oldWorker,newWorker);
    }
    function getOrder(bytes32 id) external view returns(Order memory) { return orders[id]; }
    // No receive/fallback/withdraw: forced donations cannot expand any order balance.
}
