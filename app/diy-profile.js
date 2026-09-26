'use client';
import {ExperienceProfile} from './companion-profile';
import SyncStatus from './sync-status';

export default function DiyProfile(){
 return <section className="inner-page diy-profile-page">
  <span className="eyebrow">YOUR ACCOUNT</span>
  <h1>My DIY profile</h1>
  <p>Help Kitsley explain things at the right level for you.</p>
  <ExperienceProfile expanded/>
  <p className="small"><SyncStatus/></p>
  <a className="quiet-link" href="/kit">Tools, equipment & materials in My kit →</a>
 </section>;
}
