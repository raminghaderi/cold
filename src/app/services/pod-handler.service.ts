import { Injectable } from '@angular/core'
import { AuthService } from '../services/solid.auth.service'  
import { RdfService } from '../services/rdf.service'
import * as SolidFileClient from 'solid-file-client'
import * as utils from '../utils/utililties'
import { SolidSession } from '../models/solid-session.model';


import solidnamespace from 'solid-namespace';

declare let solid: any;
declare let $rdf: any;

@Injectable({
  providedIn: 'root'
})
export class PodHandlerService {
  ns = solidnamespace($rdf);
  store = $rdf.graph()
  session: SolidSession
  fetcher: any
  updater: any
  fileClient = SolidFileClient
  me:any
  webid:any


  constructor(private auth: AuthService, private rdf: RdfService) {
      this.fetcher = rdf.fetcher
      this.updater = rdf.updateManager
      this.session = rdf.session
      this.getSession()
      
   }

  /**
   * Create workspace
   * initialise turtle files
   * Subscribe to websocket
   */
  initWorkspace(){

  }

  getSession(){
    this.auth.session.subscribe((val: SolidSession)=>{
     this.session = val
   this.webid = this.session.webId.split('profile')[0]
  this.me =  $rdf.sym(this.webid);
 //   console.log(JSON.stringify(this.session));
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
    let url = workspace + '' + containerName;
    console.log(url);
    this.fileClient.createFolder( url ).then( success => {
      if (!success) {
        console.log(this.fileClient.err);
      } else {
        console.log( `Created folder ${url}.`);
      }
  });
}

  prepareContainers=()=>{

  }

  async getStorageLocation (webid:any): Promise<{}>
  {
    return  new Promise((resolve , reject)=>{
  
      var profileDoc = utils.getProfileDocumentLocation(webid);
  
      this.fetcher.nowOrWhenFetched(profileDoc, undefined , (ok, body, xhr)=> {
          if (!ok) {
              console.log("Oops, something happened and couldn't fetch data");
              reject(xhr.status);
          } else {
          let me = $rdf.sym(webid);
        
          var storage = $rdf.sym('http://www.w3.org/ns/pim/space#storage');
          var strg = this.rdf.store.any(me, storage);
            console.log(strg);
                resolve(strg.uri);         }     
            }); 
    });
    
     
  }

}
