import { SolidSession } from './../models/solid-session.model';
import { Component,ViewEncapsulation, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { formatDate } from '@angular/common'


// Services
import { AuthService } from '../services/solid.auth.service';
import { RdfService } from '../services/rdf.service';
import { SolidProfile } from '../models/solid-profile.model';
import { PodHandlerService } from '../services/pod-handler.service';
import { Message } from '../models/message.model';

import * as SolidFileClient from "solid-file-client";

import * as utils from '../utils/utililties';

import { Workspace } from '../models/workspace.model';

declare let solid: any;
declare let $rdf: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})



export class DashboardComponent implements OnInit, OnDestroy{
  profile: SolidProfile;
  loadingProfile: Boolean;
  profileImage: string;
  session: SolidSession;
  profileId: string;
  webId: string
  //friends = ['Ramin', 'Samuel', 'Zahra'];
  existingWorkspaces:{}[] = [];
  friends=[]
  messagesList:Message[]=[]
  activeWorkSpace: Workspace
 // activeChatStoreFile: any
//  activeIndexFile: any
  fileClient = SolidFileClient
  fetcher:any
  isIndexSubscribed:boolean = false
  isChatFileSubscribed:boolean = false

  owner:string 

  @ViewChild('messageBox') messageBox: ElementRef

  constructor(private auth: AuthService,
              private route: ActivatedRoute,
              private rdf: RdfService,
              private podhandler: PodHandlerService) {}

  ngOnInit() { 
    this.fetcher =   this.fetcher = this.rdf.fetcher;
    this.loadProfile(this.getAvailableWorkspaces)
    
  }

  ngOnDestroy(){
    this.isChatFileSubscribed = false
    this.isIndexSubscribed = false
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
    let msgg = msg
     this.podhandler.sendMessage(this.activeWorkSpace,
       msgg)
       .then(_=>{ 
          console.log(msgg)
      this.messageBox.nativeElement.value = ""
      that.syncMessages();
      
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
if(!(this.isIndexSubscribed)) this.subscribe(subjectDoc,this.syncMessages)
if(!(this.isChatFileSubscribed)) this.subscribe(chatDoc,this.syncMessages)


   this.podhandler.store.each(
    subject, this.podhandler.ns.wf('message'), null,subjectDoc).forEach( st => {   
     
      
        let messageFile = st.doc().uri
      this.fileClient.fetchAndParse(messageFile,'text/turtle').then(graph=>{

     this.parseMessage(graph,st)

     },err=> console.log(err) )
      
    })

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

  subscribe =(doc,refreshFunction)=>{
  this.podhandler.updater.addDownstreamChangeListener(doc, refreshFunction)
 }

 /**
  *  Parse the message to an object
  *  */ 
 parseMessage =async (graph:any,msgSym:any)=>{


  let msg = new Message()
  let content =  graph.any(msgSym,this.podhandler.ns.sioc('content'), null)
   let time =  graph.any(msgSym,this.podhandler.ns.dc("created"), null)
   let maker =  graph.any(msgSym,this.podhandler.ns.foaf("maker"), null)

  msg.uri = msgSym.value
  msg.content =  content != undefined ? content.value :"" 
  msg.dateCreated =  new Date(time) 

  msg.maker = maker.value
  
  msg.makerProfile =  await this.rdf.getProfile(msg.maker)
 const alreadyExist = this.messagesList.find((msgObj) => msgObj.uri === msg.uri);
 if (alreadyExist === undefined) {
      this.messagesList.push(msg)
 }
  
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
