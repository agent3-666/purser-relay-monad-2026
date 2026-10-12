// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;
import '../contracts/PurserRelay.sol';
interface Vm {function prank(address) external;function deal(address,uint256) external;function warp(uint256) external;function expectRevert() external;function expectRevert(bytes4) external;function startPrank(address) external;function stopPrank() external;}
contract Reject { receive() external payable {revert();} }
contract Force {constructor() payable {}function donate(address payable a) external {selfdestruct(a);}}
contract RejectOwner {
    PurserRelay r;bytes32 public id;
    constructor(PurserRelay x) {r=x;}
    function make(address payable seller,address a,address b) external payable {id=r.createOrder{value:msg.value}(keccak256('rejectowner'),keccak256('request'),seller,msg.value,uint64(block.timestamp+10),a,b);}
    function cancel() external {r.cancel(id);}
    receive() external payable {revert();}
}
contract Attack {
    PurserRelay r;bytes32 public same;bytes32 public other;bytes32 h;address newWorker;uint public blocked;
    constructor(PurserRelay x,bytes32 hash,address n) {r=x;h=hash;newWorker=n;}
    function configure(bytes32 a,bytes32 b) external {same=a;other=b;}
    function make(address worker) external payable returns(bytes32) {return r.createOrder{value:msg.value}(keccak256('attack'),h,payable(address(this)),msg.value,uint64(block.timestamp+10),worker,address(this));}
    receive() external payable {
        (bool a,)=address(r).call(abi.encodeCall(r.consumeOrder,(same,h)));if(!a) blocked++;
        (bool b,)=address(r).call(abi.encodeCall(r.consumeOrder,(other,h)));if(!b) blocked++;
        (bool c,)=address(r).call(abi.encodeCall(r.replaceWorker,(same,address(this),newWorker)));if(!c) blocked++;
        (bool d,)=address(r).call(abi.encodeCall(r.cancel,(other)));if(!d) blocked++;
    }
}
contract RelayTest {
    Vm vm=Vm(address(uint160(uint256(keccak256('hevm cheat code')))));
    PurserRelay r;address a=address(0xA);address b=address(0xB);address c=address(0xC);address payable seller=payable(address(0xD));bytes32 h=keccak256('request');
    function setUp() public {r=new PurserRelay();vm.deal(address(this),100 ether);vm.warp(1000);}
    receive() external payable {}
    function make(bytes32 intent) internal returns(bytes32) {return r.createOrder{value:1 ether}(intent,h,seller,1 ether,1010,a,b);}
    function pay(bytes32 id,address who) internal {vm.prank(who);r.consumeOrder(id,h);}
    function testRaceOnePrincipal() public {bytes32 id=make(keccak256('one'));pay(id,a);vm.expectRevert();pay(id,b);require(seller.balance==1 ether);require(r.getOrder(id).balance==0);}
    function testIndependentOrders() public {bytes32 x=make(keccak256('one'));bytes32 y=make(keccak256('two'));pay(x,a);require(r.getOrder(y).balance==1 ether);pay(y,b);require(seller.balance==2 ether);}
    function testIntentPermanentPaid() public {bytes32 i=keccak256('one');bytes32 id=make(i);vm.expectRevert();make(i);pay(id,a);vm.expectRevert();make(i);require(r.orderForIntent(address(this),i)==id);}
    function testIntentPermanentCancelled() public {bytes32 i=keccak256('one');bytes32 id=make(i);vm.warp(1010);r.cancel(id);vm.expectRevert(PurserRelay.DuplicateIntent.selector);r.createOrder{value:1 ether}(i,h,seller,1 ether,1020,a,b);require(r.orderForIntent(address(this),i)==id);}
    function testReplaceOldLateNewPays() public {bytes32 id=make(keccak256('one'));PurserRelay.Order memory before_=r.getOrder(id);r.replaceWorker(id,a,c);vm.expectRevert();pay(id,a);pay(id,c);PurserRelay.Order memory after_=r.getOrder(id);require(after_.seller==before_.seller && after_.amount==before_.amount && after_.intent==before_.intent && after_.expiry==before_.expiry && after_.requestHash==before_.requestHash);}
    function testPaidFirstReplaceFails() public {bytes32 id=make(keccak256('one'));pay(id,a);vm.expectRevert();r.replaceWorker(id,a,c);require(!r.allowed(id,c));}
    function testRevokeTombstoneNoReplace() public {bytes32 id=make(keccak256('one'));r.revokeWorker(id,a);vm.expectRevert();r.replaceWorker(id,a,c);vm.expectRevert();pay(id,a);pay(id,b);}
    function testNoReauthorizeOrThirdSlot() public {bytes32 id=make(keccak256('one'));r.replaceWorker(id,a,c);vm.expectRevert();r.replaceWorker(id,c,a);vm.expectRevert();r.replaceWorker(id,b,c);vm.expectRevert();r.replaceWorker(id,a,address(0xEE));vm.expectRevert();r.replaceWorker(id,b,address(0));}
    function testUnauthorizedAndWrongHash() public {bytes32 id=make(keccak256('one'));vm.expectRevert();pay(id,c);vm.prank(a);vm.expectRevert();r.consumeOrder(id,bytes32(uint256(1)));vm.prank(c);vm.expectRevert();r.replaceWorker(id,a,c);vm.prank(c);vm.expectRevert();r.revokeWorker(id,a);vm.prank(c);vm.expectRevert();r.cancel(id);require(seller.balance==0);}
    function testExactExpiryCancelWins() public {bytes32 id=make(keccak256('one'));vm.warp(1010);vm.expectRevert();pay(id,a);r.cancel(id);vm.expectRevert();pay(id,b);require(uint(r.getOrder(id).status)==3);require(address(r).balance==0);}
    function testPaidBeforeExpiryNoCancel() public {bytes32 id=make(keccak256('one'));vm.warp(1009);pay(id,a);vm.warp(1010);vm.expectRevert();r.cancel(id);}
    function testEarlyCancelAndExpiredReplaceFail() public {bytes32 id=make(keccak256('one'));vm.expectRevert();r.cancel(id);vm.warp(1010);vm.expectRevert();r.replaceWorker(id,a,c);r.cancel(id);vm.expectRevert();r.replaceWorker(id,a,c);}
    function testRejectSellerRollback() public {Reject bad=new Reject();bytes32 id=r.createOrder{value:1 ether}(keccak256('bad'),h,payable(address(bad)),1 ether,1010,a,b);vm.expectRevert();pay(id,a);require(uint(r.getOrder(id).status)==1 && r.getOrder(id).balance==1 ether && r.getOrder(id).winner==address(0));}
    function testRejectRefundRollback() public {RejectOwner owner=new RejectOwner(r);owner.make{value:1 ether}(seller,a,b);vm.warp(1010);vm.expectRevert();owner.cancel();require(uint(r.getOrder(owner.id()).status)==1 && r.getOrder(owner.id()).balance==1 ether);}
    function testReentrySameCrossReplaceCancel() public {Attack attack=new Attack(r,h,c);bytes32 x=attack.make{value:1 ether}(a);bytes32 y=r.createOrder{value:1 ether}(keccak256('other'),h,seller,1 ether,1010,address(attack),b);attack.configure(x,y);pay(x,a);require(attack.blocked()==4);require(r.getOrder(y).balance==1 ether);require(uint(r.getOrder(x).status)==2);}
    function testDonationNoAdditionalPrincipal() public {bytes32 id=make(keccak256('one'));Force f=new Force{value:7 ether}();f.donate(payable(address(r)));require(r.getOrder(id).amount==1 ether && r.getOrder(id).balance==1 ether);pay(id,a);require(seller.balance==1 ether && address(r).balance==7 ether);}
    function testCreateInvalid() public {vm.expectRevert();r.createOrder{value:1 ether}(bytes32(0),h,seller,1 ether,1010,a,b);vm.expectRevert();r.createOrder{value:2 ether}(keccak256('bad'),h,seller,1 ether,1010,a,b);vm.expectRevert();r.createOrder{value:1 ether}(keccak256('bad'),h,seller,1 ether,1010,a,a);}
    function testRevokeAfterPayCannotUnpay() public {bytes32 id=make(keccak256('one'));pay(id,a);vm.expectRevert();r.revokeWorker(id,a);require(uint(r.getOrder(id).status)==2);}
}
