import { PodHandlerService } from "../services/pod-handler.service"
import * as utils from '../utils/utililties';

export class Workspace {
    uri:string
   private name:string
    owner:string
    podhandler:PodHandlerService
    indexFile:string
    me:string

    constructor( uri:string,me:string){
        this.uri = uri // has trailing slash
        this.me = me
      this.init()
        
    }

    init=async()=>{
        await this.getOwner()
       
    }

    getName():string{
        return this.name
    }
    setName(name:string){
        this.name = name
    }

    localIndexFile=():string=>{
               return this.uri+"/index.ttl"
    }

    getChatStoreFile():string{
        return this.uri+"/chats.ttl"
    }

   private getOwner =async()=>{        
    
     
    }

    isMine():boolean{
        return this.owner === this.me
    }

 

}
