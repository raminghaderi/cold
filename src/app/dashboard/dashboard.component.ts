import { SolidSession } from './../models/solid-session.model';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

// Services
import { AuthService } from '../services/solid.auth.service';
import { RdfService } from '../services/rdf.service';
import { SolidProfile } from '../models/solid-profile.model';
import { PodHandlerService } from '../services/pod-handler.service';
import * as SolidFileClient from "solid-file-client";

import * as utils from '../utils/utililties';

import { Workspace } from '../models/workspace.model';
import { fetcher } from 'dist/solid-app/assets/types/rdflib';

declare let solid: any;


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})

export class DashboardComponent implements OnInit {
  profile: SolidProfile;
  loadingProfile: Boolean;
  profileImage: string;
  session: SolidSession;
  profileId: string;
  webId: string
  //friends = ['Ramin', 'Samuel', 'Zahra'];
  existingWorkspaces:{}[] = [];
  friends=[]
  messagesList:{uri?:string,value?:string}[]=[]
  activeWorkSpace: Workspace
 // activeChatStoreFile: any
//  activeIndexFile: any
  fileClient = SolidFileClient
  fetcher:any

  owner:string 

  constructor(private auth: AuthService,
              private route: ActivatedRoute,
              private rdf: RdfService,
              private podhandler: PodHandlerService) {}

  ngOnInit() { 
    this.fetcher =   this.fetcher = this.rdf.fetcher;
    this.loadProfile(this.getAvailableWorkspaces)

  }

  async loadProfile(callBackFn) {
    try {
      this.loadingProfile = true;
      this.session =  await solid.auth.currentSession();
      this.profileId = this.session.webId;
      this.webId = this.profileId.split('/profile')[0];

      const profile = await this.rdf.getProfile(this.profileId);
         
      if (profile) {
      this.profile = profile;
        this.auth.saveOldUserData(profile); 
          
        // LoadFriends
        for (let f=0; f<profile.friends.length; f++){
         let friendProfile = await this.rdf.getProfile(profile.friends[f])
          this.friends.push(friendProfile)
        }
      }

      this.loadingProfile = false;
      this.setupProfileData()
      callBackFn()
    } catch (error) {
      console.log(`Error: ${error}`);
    }

  }

  private setupProfileData() {
    if (this.profile) {
      this.profileImage = this.profile.image ? this.profile.image : '/assets/images/profile.png';
    } else {
      this.profileImage = '/assets/images/profile.png';
    }
  }

  logout() {
    this.auth.solidSignOut();
  }

 setActiveWS= async(wkspace:any)=>{

    this.activeWorkSpace = new Workspace(wkspace.url,this.profileId)
    this.activeWorkSpace.setName(wkspace.name)
   this.activeWorkSpace.owner = await  this.podhandler.loadResource(this.activeWorkSpace.localIndexFile())
    .then(async (res)=>{
           let sym =  this.podhandler.store.sym(this.activeWorkSpace.localIndexFile()+"#this")
      let owner = this.podhandler.store.any(sym,
          this.podhandler.store.sym(this.podhandler.ns.dc("author"))).uri

          return owner
    })
    .catch(err=>{
        console.log(err)
    })

   this.activeWorkSpace.indexFile = await this.workingIndex()

   
   //this.activeChatStoreFile = this.podhandler.getChatDocument(wkspace)

  // this.activeIndexFile = this.podhandler.getIndexfile(wkspace);
  // load the file and get the owner

  await  this.syncMessages()
    
  
 }

 send=(msg:string)=>{
   let that = this
 
     this.podhandler.sendMessage(this.activeWorkSpace,
       msg)
       .then(_=>{ 
          console.log(msg)
      that.syncMessages()
     }
    ).catch(err=>{
      console.log("Error "+err)
    })
   
 }

 
syncMessages= async ()=> {

// get references to the index.ttl and chat.ttl files and load to store

let indexDoc = this.workingIndex()+"#this"
await Promise.all([  this.podhandler.loadResource(indexDoc) ,
  this.podhandler.loadResource(this.activeWorkSpace.getChatStoreFile())
 ]) 
  .then(async _=>{
  
    let subject = this.podhandler.store.sym(indexDoc)
    let subjectDoc = subject.doc()
 let chatDoc = this.podhandler.store.sym(this.activeWorkSpace.getChatStoreFile()).doc()
 // Subscribe to receive changes
this.subscribe(chatDoc,this.syncMessages)
this.subscribe(subjectDoc,this.syncMessages)


   this.podhandler.store.each(
    subject, this.podhandler.ns.wf('message'), null,subjectDoc).forEach( st => {   
     
      const msgSym = st
        let messageFile = st.doc().uri
      this.fileClient.fetchAndParse(messageFile,'text/turtle').then(graph=>{

        let msg =  graph.any(
           msgSym,this.podhandler.ns.sioc('content'), null)
            let stored:{uri?:string,value?:string}={}
         
        stored['uri'] = msgSym.value
        stored['msg'] =  msg != undefined ? msg.value :"" 
         
  
        const alreadzExist = this.messagesList.find((msgObj) => msgObj.uri === stored.uri);
        if (alreadzExist === undefined) {
             this.messagesList.push(stored)
        }
      //  return stored
       
     },err=> console.log(err) )
      
    })

  //this.messagesList = await Promise.all(messagesMap)

  
  }, (err)=> {
    // error occurred
    console.log(err)
});

}

 getAvailableWorkspaces = async() => {
   let storageSpace=this.webId+"/public"
  await this.podhandler.getListWorkSpaces(storageSpace)
  .then( value => {
    if(typeof value === "object") {
      this.existingWorkspaces = value.folders
    }
       
   // do something with the workspaces
     console.log("Workspaces: "+JSON.stringify(value))
  })
     
 }

 parseMessages=()=>{

 }

  subscribe =(doc,refreshFunction)=>{
  this.podhandler.updater.addDownstreamChangeListener(doc, refreshFunction)
 }

 getOwner(workspace:string):string{

   return ""
 }

 workingIndex():any{
  if(this.activeWorkSpace.isMine()) 
  { 
     
    return this.activeWorkSpace.localIndexFile()
  }
  else {
   
    let subject = this.podhandler.store.sym(this.activeWorkSpace.localIndexFile()+"#this")
   
    let pred =   this.podhandler.store.sym(this.podhandler.ns.rdf("seeAlso"))

    let innd =  this.podhandler.store.canon(this.podhandler.store.any(subject,pred))
 

    return innd      
  }
}

}
