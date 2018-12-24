import { Injectable } from '@angular/core'
import { AuthService } from '../services/solid.auth.service'  
import { RdfService } from '../services/rdf.service'
import * as SolidFileClient from 'solid-file-client'
import * as utils from '../utils/utililties'
import { SolidSession } from '../models/solid-session.model'
import containers from '../containers.json'

import solidnamespace from 'solid-namespace'

declare let $rdf: any;

@Injectable({
  providedIn: 'root'
})
export class PodHandlerService {
  ns = solidnamespace($rdf)
  store = this.rdf.store
  session: SolidSession
  fetcher: any
  updater: any
  fileClient = SolidFileClient
  me:any
  webid:any
  activeWorkspace:any
  existingWorkspaces:any[]
  storageLocation:string

 

  readonly publicStorage = "public"


  constructor(private auth: AuthService, private rdf: RdfService) {
      this.fetcher = this.rdf.fetcher
      this.updater = this.rdf.updateManager
      this.session = this.rdf.session
      this.getSession()
   }


   getSession(){
    this.auth.session.subscribe(async (val: SolidSession)=>{
     this.session = val
   this.webid = this.session.webId.split('profile')[0]
  this.me =  $rdf.sym(this.webid);
 
   
   this.getStorageLocation(this.session.webId)
   .then(val=>{
     this.storageLocation = val;
    
   })
      
   })
 }

  resourceExists(url:string, iscontainer:boolean): Promise<any> {

    return new Promise((resolve,reject)=>{
      // check if it's a container or file
     
        this.fileClient.fetch(url).then(response => {
          if (response){
             resolve({"resource":url, "content":response});
          }
          else {            
          reject({"resource": url , "error": this.fileClient.err});
          }
        })
        .catch((error)=>{                  
          reject({"resource": url , "error": error});
        });
     
    });
  }

  createContainer(workspace,containerName) {
    let url = workspace + '/' + containerName;
  
    return new Promise((resolve,reject)=>{
    this.resourceExists(url,true)
    .then(response=>{
        console.log("Resource already exists: "+url)
        reject ("Resource already exists: "+url)
    })
    .catch(err=>{
      // folder doesn't exist
            this.fileClient.createFolder( url ).then( success => {
      if (success) {
        console.log( `Created folder ${url}.`);
        resolve (url)
      } 
      else {
        console.log(this.fileClient.err)
        reject (this.fileClient.err)
      }
  })
    })

    })
 
  

}

 async defaultAppContainerUrl (): Promise<string>{
   return this.storageLocation+ this.publicStorage +"/"+containers.rootContainer
    
  } 


  /**
   * Create workspace
   * initialise turtle files
   * Subscribe to websocket
   */
  initializeContainers = async (foldername:string)=>{
      let isNew=true;
  
    
             var parentDir = this.storageLocation + this.publicStorage;
             
          // create root container for app data
      await    this.createContainer(parentDir,containers.rootContainer)
      .then(url0=>{


      })
      .catch(err=>{
        console.log(err)
        //TODO: check here if the error code is 404 
      } )
      
     parentDir +="/"+containers.rootContainer
        // Create provided workspace container
      await  this.createContainer(parentDir,foldername)
      .then(workspace=>{ 
       parentDir = ''+workspace
         //containers definition is loaded. Now time to ensure containers exists
     for (var key in containers.subContainers)
     {
       (async (k)=> {
       
       let value = containers.subContainers[k];
       let resType = (typeof value === "object")? "resource" : "container";
       
       let resPath = "";
       let resData = "";

       if ( resType === "container" )
         resPath = value;
       else {
         resPath = value.path;
         resData = value.data;
       }            

        console.log("Full path: "+parentDir+resPath);
       this.createContainer(parentDir,resPath)
       .then(url2=>{
            
       }).catch(err2 =>{
          console.log(err2)
       })

    
       })(key)
    }

      }).catch(err1=>{
        isNew = false  
        console.log("Not  new")
      })
              

          if(isNew) 
            await this.createNewChat(parentDir) 

  }

   getStorageLocation = async(webid:any)=>
  {  
    return  new Promise<string>((resolve , reject)=>{
  
    var profileDoc = utils.getProfileDocumentLocation(webid);

    this.fetcher.nowOrWhenFetched(profileDoc, undefined , (ok, body, xhr)=> {
        if (!ok) {
            console.log("Oops, something happened and couldn't fetch data");
            reject(xhr.status);
        } else {
        let me = $rdf.sym(webid);
      
        var storage = $rdf.sym('http://www.w3.org/ns/pim/space#storage');
        var strg = this.rdf.store.any(me, storage);
        //  console.log(strg);
              resolve(strg.uri);         }     
          }); 
  });
    
  }

  createNewChat(loc:string){
    var newInstance = this.store.sym(loc + '/index.ttl#this')
    var newChatDoc = newInstance.doc()

    this.store.add(newInstance, this.ns.rdf('type'), this.ns.meeting('Chat'), newChatDoc)
    this.store.add(newInstance, this.ns.dc('title'), 'Chat', newChatDoc)
    this.store.add(newInstance, this.ns.dc('created'), new Date(), newChatDoc)
    
      this.store.add(newInstance, this.ns.dc('author'), this.me, newChatDoc)
  

    return new Promise( (resolve, reject)=> {
      this.updater.put(
        newChatDoc,
        this.store.statementsMatching(undefined, undefined, undefined, newChatDoc),
        'text/turtle',
        function (uri2, ok, message) {
          if (ok) {
            resolve(uri2)
          } else {
            reject(new Error('FAILED to save new tool at: ' + uri2 + ' : ' +
              message))
          };
        })
    })
  }

  /**
   * Get a list of workspaces
   */
 async getListWorkSpaces(url): Promise<any> {
  let workspaces:{}
 
    
// note url must end with a /
    const appdataUrl =  url+containers.rootContainer+"/";
    let wklist = []
    let appstore = this.store.sym(appdataUrl)
  await this.getFolderItems(this.store,appstore)
    .then(value =>{
      workspaces = value;
    })       
  return workspaces
  }


   async getFolderItems(graph:any,subject:string) {
   
    let contains = {
        folders : [],
        files   : []
     } 
 
     //load a folder and get the contents
     let files=[]
    await  this.fetcher.load(subject).then(() => {
        // get the folder contents
       files = this.store.match(subject, this.ns.ldp('contains')).concat(this.store.match(null, this.ns.rdf('type'), this.ns.ldp('container'), null)).map(st=>st.object)
        
    for(let i=0;i<files.length;i++){
         var item = files[i];
         var newItem: any = {}
         newItem.type = this.getFileType(this.store, item.value )
        
     //    var stats = self.getStats(graph,item.value)
     //    newItem.modified = stats.modified
     //    newItem.size = stats.size
     //    newItem.mtime = stats.mtime
         newItem.label=decodeURIComponent(item.value).replace( /.*\//,'')
         if(newItem.type==='folder'){
              item.value = item.value.replace(/[/]+/g,'/');
              item.value = item.value.replace(/https:/,'https:/');
              var name = item.value.replace( /\/$/,'')
              newItem.name = name.replace( /.*\//,'')
              newItem.url  = item.value
              contains.folders.push(newItem)
         }
         else {
              newItem.url=item.value
              newItem.name=item.value.replace(/.*\//,'')
              contains.files.push(newItem)
         }
    }

  
  return contains;
  }).catch(err=>{
    console.log(err)
  })  

 return contains;
}

getFileType = ( graph, url )=>{
  
  var subj = this.store.sym(url)
  var pred=this.store.sym(this.ns.rdf('type'))
  var type = graph.any(subj,pred,undefined)
 
      let regexContainer = new RegExp("ldp#BasicContainer")
      let regexMediatype = new RegExp("http://www.w3.org/ns/iana/media-types/")
    
      if( regexContainer.test(type) )
          return "folder"
          
      if(regexMediatype.test(type)){
          type=type.replace("http://www.w3.org/ns/iana/media-types/",'')
          return type.replace('#Resource','')
      }
  return "unknown"
}

}
