'use client';
import {useSyncExternalStore} from 'react';
import {subscribeSync,syncStatus,syncNow} from '../lib/account-storage.mjs';
const initial={state:'loading',text:'Loading your workspace…',user:null};
export function useSyncStatus(){return useSyncExternalStore(subscribeSync,syncStatus,()=>initial);}
export default function SyncStatus(){const status=useSyncStatus();return <span className="sync-status" role="status">{status.text}{status.state==='error'&&<button className="text-button" onClick={()=>syncNow()}>Retry sync</button>}{status.state==='expired'&&<button className="text-button" onClick={()=>window.location.reload()}>Reload & sign in</button>}</span>;}
