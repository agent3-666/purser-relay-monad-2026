from pathlib import Path
import tempfile,shutil,subprocess,json
root=Path(__file__).resolve().parents[1]
mutations=[('remove-canonical-parent-check','reconcile.ts',"if(!parent||!eq(parent.hash,cursor.parentHash))throw new Error('Broken canonical ancestry');","if(!parent)throw new Error('Missing parent');",'missing/broken ancestry'),('use-gasUsed-on-Monad','reconcile.ts','chainId===10143?gasLimit:BigInt(receipt.gasUsed)','BigInt(receipt.gasUsed)','Monad fee/budget')]
results=[]
for label,file,old,new,test in mutations:
 with tempfile.TemporaryDirectory(prefix='relay-ts-bad-') as tmp:
  p=Path(tmp)
  for folder in ['src','test','out']:shutil.copytree(root/folder,p/folder)
  for name in ['package.json','tsconfig.json']:shutil.copy(root/name,p/name)
  (p/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
  f=p/'src'/file;s=f.read_text();assert old in s;f.write_text(s.replace(old,new));r=subprocess.run(['node','--import','tsx','--test','--test-name-pattern='+test,'test/reconcile.test.ts'],cwd=p,capture_output=True,text=True)
  caught=r.returncode!=0 and 'not ok' in r.stdout;results.append({'mutation':label,'caught':caught,'exit':r.returncode,'output':r.stdout[-4000:]})
(root/'evidence/ts-mutations.json').write_text(json.dumps(results,indent=2));print([(x['mutation'],x['caught']) for x in results]);assert all(x['caught'] for x in results)
