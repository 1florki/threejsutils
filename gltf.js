import {
  GLTFLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';
import {
  SkeletonUtils
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/utils/SkeletonUtils.js';


export class GLTFHelper {
  constructor() {
    this.models = {};
    
    this.toLoad = 0;
    this.loaded = 0;
  }
  loadMultiple(dict) {
    let keys = Object.keys(dict);
    for (let k of keys) {
      this.load(dict[k], undefined, k);
    }
  }
  load(a, parent, key, pos) {
    this.toLoad += 1;
    if (this.gltfLoader == undefined) this.gltfLoader = new GLTFLoader();

    gltfLoader.load(a, (model) => {
      model.scene.gltf = model;
      this.loaded += 1;
      if (pos != undefined) model.scene.position.copy(pos);
      if (parent != undefined) parent.add(model.scene);
      if (key != undefined) this.models[key] = model.scene;
    });
  }
  allLoaded() {
    return this.toLoad == this.loaded;
  }
}
