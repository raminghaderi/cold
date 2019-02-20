import { Injectable } from "@angular/core";
import { AuthService } from "../services/solid.auth.service";
import { RdfService } from "../services/rdf.service";
import * as SolidFileClient from "solid-file-client";
import * as utils from "../utils/utililties";
import { SolidSession } from "../models/solid-session.model";
import CONTAINERS from "../containers.json";

import solidnamespace from "solid-namespace";
import { Workspace } from "../models/workspace.model";

declare let $rdf: any;

@Injectable({
  providedIn: "root"
})
export class PodHandlerService {
  ns = solidnamespace($rdf);
  store = this.rdf.store;
  session: SolidSession;
  fetcher: any;
  updater: any;
  fileClient = SolidFileClient;
  me: any;
  webid: any;
  activeWorkspace: any;
  existingWorkspaces: any[];
  storageLocation: string;

  readonly publicStorage = "public";

  constructor(private auth: AuthService, private rdf: RdfService) {
    this.fetcher = this.rdf.fetcher;
    this.updater = this.rdf.updateManager;
    this.session = this.rdf.session;
    this.getSession();
  }

  getSession() {
    this.auth.session.subscribe((val: SolidSession) => {
      this.session = val;
      this.me = $rdf.sym(this.session.webId);
      this.webid = this.session.webId.split("profile")[0];
      

      this.getStorageLocation(this.session.webId).then(val => {
        this.storageLocation = val;
      });
    });
  }

  resourceExists(url: string, iscontainer: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      // check if it's a container or file

      this.fileClient
        .fetch(url)
        .then(response => {
          if (response) {
            resolve({ resource: url, content: response });
          } else {
            reject({ resource: url, error: this.fileClient.err });
          }
        })
        .catch(error => {
          reject({ resource: url, error: error });
        });
    });
  }

  createContainer(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.resourceExists(url, true)
        .then(response => {
          console.log("Resource already exists: " + url);
          resolve(url);
        })
        .catch(err => {
          // folder doesn't exist
          this.fileClient.createFolder(url).then(success => {
            if (success) {
              console.log(`Created folder ${url}.`);
              resolve(url);
            } else {
              console.log(this.fileClient.err);
              reject(this.fileClient.err);
            }
          });
        });
    });
  }

  defaultAppContainerUrl(): string {
    return (
      this.storageLocation + this.publicStorage + "/" + CONTAINERS.rootContainer
    );
  }

  /**
   * Create workspace
   * initialise turtle files
   * Subscribe to websocket
   */
  // TODO: should return Success or failure
  initializeContainers = async (destination: string, isOwner = true) => {
    let isNew = true;

    let foldername = this.getWkSpaceName(destination);
    let canAccess = true; // user has permissions to access resource
    // !isOwner check first if this user can access the provided
    if (!isOwner) {
      canAccess = await this.loadResource(destination);
    }

    if (canAccess) {
      var parentDir = this.storageLocation + this.publicStorage;

      // create root container for app data
      await this.createContainer(parentDir + "/" + CONTAINERS.rootContainer)
        .then(wkspce => {
          return this.createContainer(wkspce + "/" + foldername);
        })
        .then(rootDir => {
       
          /*
    //containers definition is loaded. Now time to ensure containers exists
    for (var key in CONTAINERS.subContainers) {
      (async k => {
        let value = CONTAINERS.subContainers[k];
        let resType = typeof value === "object" ? "resource" : "container";
  
        let resPath = "";
        let resData = "";
  
        if (resType === "container") resPath = value;
        else {
          resPath = value.path;
          resData = value.data;
        }
  
        this.createContainer(rootDir+"/"+resPath)
          .then(url2 => {})
          .catch(err2 => {
            console.log(err2);
          });
      })(key);
    }  */

          this.createNewChat(rootDir, isOwner,destination).then(_ => {
            // create chat store file
            this.createFile(rootDir + "/chats.ttl");
          });
        })
        .catch(err => {
          console.log(err);
          //TODO: check here if the error code is 404
        });
    }

    /*
      .catch(err1 => {
        isNew = false;
        console.log("Not  new");
      });
    */
  }

  getStorageLocation = (webid: any) => {
    return new Promise<string>((resolve, reject) => {
      var profileDoc = utils.getProfileDocumentLocation(webid);

      this.fetcher.nowOrWhenFetched(profileDoc, undefined, (ok, body, xhr) => {
        if (!ok) {
          console.log("Oops, something happened and couldn't fetch data");
          reject(xhr.status);
        } else {
          let me = $rdf.sym(webid);

          var storage = $rdf.sym("http://www.w3.org/ns/pim/space#storage");
          var strg = this.rdf.store.any(me, storage);
          //  console.log(strg);
          resolve(strg.uri);
        }
      });
    });
  };

  createFile(file: string) {
    //updateFile used because it deletes existing file and creates new
    this.fileClient.createFile(file).then(
      success => {
        console.log(`created ${file}.`);
      },
      err => console.log(err)
    );
  }

  createNewChat(newDir: string, isOwner, original?: string) {
    
    
    return new Promise(async (resolve, reject) => {
// index.ttl holds chat preferences
    // Original should only have value if isOwner is false
    let newInstance;
    let newChatDoc;  
    
    let originFile = original+"/index.ttl"
     
        let originSym = this.store.sym(originFile+"#this") 
        let originDoc = originSym.doc()

    if (isOwner) {
      newInstance = this.store.sym(newDir + "/index.ttl#this");
      newChatDoc = newInstance.doc();

      this.store.add(
        newInstance,
        this.ns.rdf("type"),
        this.ns.meeting("LongChat"),
        newChatDoc
      );
      this.store.add(newInstance, this.ns.dc("title"), "Chat", newChatDoc);
      this.store.add(
        newInstance,
        this.ns.dc("created"),
        new Date(),
        newChatDoc
      );

      this.store.add(newInstance, this.ns.dc("author"), this.me, newChatDoc);
    } 
    else {
     
     
     
     await   this.loadResource(originDoc)
       .then((response)=>{
   
       let owner = this.store.any(originSym,
        this.store.sym(this.ns.dc("author")));
        console.log("Author: "+owner)

        newInstance = this.store.sym(newDir + "/index.ttl#this");

        
     
      newChatDoc = newInstance.doc();
      this.store.add(
        newInstance,
        this.ns.rdf("type"),
        this.ns.meeting("LongChat"),
        newChatDoc
      );
      this.store.add(
        newInstance,
        this.ns.rdf("seeAlso"),
        originDoc.uri,
        newChatDoc
      );
         
      this.store.add(newInstance, this.ns.dc("author"), this.store.sym(owner), newChatDoc);
        


       }
      ).catch(err=>{
         reject(   new Error(
          "FAILED to load the chat file at: " + err ))
       }  )
   }

   if(!isOwner && original != undefined){
    let participation = this.newThing(originDoc)
    
    console.log("Original "+originSym)
   
      this.store.add(originSym, this.ns.wf('participation'), participation, originDoc)        

      this.store.add(participation, this.ns.wf('participant'), this.me, originDoc)
      this.store.add(participation, this.ns.cal('dtstart'), new Date(), originDoc)
     // new $rdf.Statement(participation, this.ns.ui('backgroundColor'), UI.pad.lightColorHash(me), padDoc)

    await    this.updater.put(
      originDoc,
      this.store.statementsMatching(
        undefined,
        undefined,
        undefined,
        originDoc
      ),
      "text/turtle",
      function(uri2, ok, message) {
        if (ok) {
        //  resolve(uri2);
        } else {
          reject(
            new Error(
              "FAILED to save new resource at: " + uri2 + " : " + message
            )
          );
        }
      }
    ); 
   }

  await    this.updater.put(
        newChatDoc,
        this.store.statementsMatching(
          undefined,
          undefined,
          undefined,
          newChatDoc
        ),
        "text/turtle",
        function(uri2, ok, message) {
          if (ok) {
            resolve(uri2);
          } else {
            reject(
              new Error(
                "FAILED to save new resource at: " + uri2 + " : " + message
              )
            );
          }
        }
      );


    });
  }

  /**
   * Get a list of workspaces
   */
  async getListWorkSpaces(url): Promise<any> {
    let workspaces: {};

    // note url must end with a /
    const appdataUrl = url + "/" + CONTAINERS.rootContainer;
    console.log("AppData "+appdataUrl)
    let wklist = [];
    let appstore = this.store.sym(appdataUrl);
    return await this.getFolderItems(this.store, appstore).then(value => {
      return value;
    });
  }

  getFileContent = async (file: string) => {
    let contents = [];

    return await this.fetcher.load(file).then(
      response => {
        // get the folder contents
        contents = this.store.match(this.store.sym(file), undefined, undefined);

        console.log(contents);

        return contents;
      },
      err => {
        console.log(err);
        return err
      }
    );
  };

  getFolderItems = async (graph: any, subject: any) => {
    let contains = {
      folders: [],
      files: []
    };

    //load a folder and get the contents
    let files = [];
    await this.fetcher
      .load(subject)
      .then((_) => {
        // get the folder contents
        files = this.store
          .match(subject, this.ns.ldp("contains"))
          .concat(
            this.store.match(
              null,
              this.ns.rdf("type"),
              this.ns.ldp("container"),
              null
            )
          ) 
          .map(st => st.object);

        for (let i = 0; i < files.length; i++) {
          var item = files[i];

          var newItem: any = {};
          newItem.type = this.getFileType(this.store, item.value);

          //    var stats = self.getStats(graph,item.value)
          //    newItem.modified = stats.modified
          //    newItem.size = stats.size
          //    newItem.mtime = stats.mtime
          newItem.label = decodeURIComponent(item.value).replace(/.*\//, "");
          
            var name = item.value.replace(/\/$/, "");
            newItem.name = name.replace(/.*\//, "");
            item.value = item.value.replace(/[/]+/g, "/");
            item.value = item.value.replace(/https:/, "https:/");
            newItem.url = subject.doc().uri+"/"+ newItem.name;
          if (newItem.type === "folder") {
           
            contains.folders.push(newItem);
          } else {
            contains.files.push(newItem);
          }
        }

        return contains;
      })
      .catch(err => {
        console.log(err);
      });

    return contains;
  };

  getFileType = (graph, url) => {
    var subj = this.store.sym(url);
    var pred = this.store.sym(this.ns.rdf("type"));
    var type = graph.any(subj, pred, undefined);

    let regexContainer = new RegExp("ldp#BasicContainer");
    let regexMediatype = new RegExp("http://www.w3.org/ns/iana/media-types/");

    if (regexContainer.test(type)) return "folder";

    if (regexMediatype.test(type)) {
      type = type.replace("http://www.w3.org/ns/iana/media-types/", "");
      return type.replace("#Resource", "");
    }
    return "unknown";
  };

  //subject is the directory
  // messageStore is subject.doc()
  sendMessage = async (workspace: Workspace, msg: string) => {

    var now = new Date();
    var timestamp = "" + now.getTime();
    var dateStamp = $rdf.term(now);

    let subject = this.store.sym(workspace.indexFile+"#this"); 

    //TODO: Get All participants and load their messages
  
    let chatdoc = this.store.sym(workspace.getChatStoreFile());
    let messageStore = chatdoc.doc(); 
    let subjectDoc = subject.doc()
    // http://www.w3schools.com/jsref/jsref_obj_date.asp
    var message = this.store.sym(messageStore.uri + "#" + "Msg" + timestamp);
  
  
    this.store.add(subject, this.ns.wf("message"), message, subjectDoc)

    // sts.push(new $rdf.Statement(message, ns.dc('title'), kb.literal(titlefield.value), messageStore))
  /*  sts.push(
      new $rdf.Statement(
        message,
        this.ns.sioc("content"),
        this.store.literal(msg),
        messageStore
      )
    ); */

    this.store.add(message,this.ns.sioc("content"),this.store.literal(msg),messageStore)
/*
    sts.push(
      new $rdf.Statement(
        message,
        this.ns.dc("created"),
        dateStamp,
        messageStore
      )
    ); */

    this.store.add( message,
      this.ns.dc("created"),
      dateStamp,
      messageStore)


  //  if (workspace.isMine)
        this.store.add(message,this.ns.foaf("maker"),workspace.me,messageStore)
/*
    var sendComplete = function(uri, success, body) {
      if (!success) {
        console.log("Error message "+body);
        return false;
      } else {
        return true;
      }
    };
    this.updater.update([], sts, sendComplete);   */
   
    await    this.updater.put(
      subjectDoc,
      this.store.statementsMatching(
        undefined,
        undefined,
        undefined,
        subjectDoc
      ),
      "text/turtle",
      function(uri2, ok, message) {
        if (ok) {
        //  resolve(uri2);
        } else {
         console.log(
            new Error(
              "FAILED to save new resource at: " + uri2 + " : " + message
            )
          );
        }
      }
    ); 
 
   await    this.updater.put(
     messageStore,
     this.store.statementsMatching(
       undefined,
       undefined,
       undefined,
       messageStore
     ),
     "text/turtle",
     function(uri2, ok, message) {
       if (ok) {
       //  resolve(uri2);
       } else {
        console.log(
           new Error(
             "FAILED to save new resource at: " + uri2 + " : " + message
           )
         );
       }
     }
   ); 

  };

  // create chat document
  getChatDocument(wkspace): any {
    let defaultContainer = this.defaultAppContainerUrl();

    //TODO: check if owner or not and return link

    return defaultContainer + "/" + wkspace + "/chats.ttl";
  }

  getIndexfile(workspace: string): string {
    let defaultContainer = this.defaultAppContainerUrl();

    //TODO: check if owner or not and return link

    return defaultContainer + "/" + workspace + "/index.ttl";
  }

  loadResource = async (url: string): Promise<boolean> => {

    return  this.fetcher.load(url).then(
      response => {
      //  console.log("Resource loaded: "+ JSON.stringify(response))
        return true;
      },
      err => { 
        console.log(err)
        return false;
      });
  };

  joinWorkSpace = (toJoin: string) => {
    // Click on join
    // Add to participantlist
    // Extract workspace name from
    // set original url
    toJoin = utils.removeTrailingSlash(toJoin);
    this.initializeContainers(toJoin, false);

  };

  getWkSpaceName(url: string): string {
    console.log("URL "+url)
    url = utils.removeTrailingSlash(url);
    return url.split(CONTAINERS.rootContainer + "/")[1].split("/")[0];
  }

  newThing = function (doc) {
    var now = new Date()
    return $rdf.sym(doc.uri + '#' + 'id' + ('' + now.getTime()))
  }

}
