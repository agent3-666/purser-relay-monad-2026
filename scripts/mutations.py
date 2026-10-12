#!/usr/bin/env python3
from pathlib import Path
import tempfile,shutil,subprocess,json
root=Path(__file__).resolve().parents[1]
base=(root/'contracts/PurserRelay.sol').read_text()
mutations=[('remove-intent-guard','if(orderForIntent[msg.sender][intent]!=0) revert DuplicateIntent();','','testIntentPermanentCancelled'),('allow-revoked-slot','|| !allowed[id][oldWorker]','','testRevokeTombstoneNoReplace'),('allow-reuse-address','|| everAuthorized[id][newWorker]','','testNoReauthorizeOrThirdSlot'),('allow-wrong-hash','if(o.requestHash!=requestHash) revert Invalid();','','testUnauthorizedAndWrongHash')]
results=[]
for label,old,new,test in mutations:
 assert old in base
 with tempfile.TemporaryDirectory(prefix='purser-mutation-') as tmp:
  d=Path(tmp);shutil.copytree(root/'contracts',d/'contracts');shutil.copytree(root/'test',d/'test',ignore=shutil.ignore_patterns('*.ts'));shutil.copy(root/'foundry.toml',d/'foundry.toml');(d/'contracts/PurserRelay.sol').write_text(base.replace(old,new))
  r=subprocess.run(['forge','test','--match-test',test],cwd=d,capture_output=True,text=True)
  caught=r.returncode!=0 and '[FAIL' in r.stdout
  results.append({'mutation':label,'test':test,'caught':caught,'exit':r.returncode,'output':r.stdout[-4000:],'stderr':r.stderr[-500:]})
(root/'evidence/contract-mutations.json').write_text(json.dumps(results,indent=2));print([(x['mutation'],x['caught']) for x in results]);assert all(x['caught'] for x in results)
