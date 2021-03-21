import {
  GLTFLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';

export class GLTFHelper {
  constructor(dict, doneCallback) {
    this.models = {};
    
    this.toLoad = 0;
    this.loaded = 0;
    this.done = doneCallback;
    if(dict) this.loadMultiple(dict);
  }
  loadMultiple(dict) {
    let keys = Object.keys(dict);
    for (let k of keys) {
      this.load(dict[k], k);
    }
  }
  load(a, key, parent, pos) {
    this.toLoad += 1;
    if (this.gltfLoader == undefined) this.gltfLoader = new GLTFLoader();

    gltfLoader.load(a, (model) => {
      model.scene.gltf = model;
      this.loaded += 1;
      if (pos != undefined) model.scene.position.copy(pos);
      if (parent != undefined) parent.add(model.scene);
      if (key != undefined) this.models[key] = model.scene;
      
      if(this.done != undefined && this.allLoaded()) this.done(); 
    });
  }
  allLoaded() {
    return this.toLoad == this.loaded;
  }
}
