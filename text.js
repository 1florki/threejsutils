import { FontLoader, TextGeometry, MeshStandardMaterial, Mesh, Color } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

const defaultSettings = {
    size: 0.5,
    height: 0.1,
    curveSegments: 0,
    bevelEnabled: false
  }

export class TextGenerator {
  constructor(fontURL) {
    const loader = new FontLoader();
    loader.load(fontURL || "https://1florki.github.io/threejsutils/oswald.json", (loadedFont) => {
      this.font = loadedFont;
    });
  }
  fontLoaded() {
    return (this.font != undefined);
  }
  
  textGeometry(text, settings) {
    if(!this.fontLoaded()) return undefined;
    
    settings = settings || defaultSettings;
    settings.font = this.font;
    
    return new TextGeometry(text, settings);
  }
  textMesh(text, settings, color) {
    if(!this.fontLoaded()) return undefined;
    let geo = this.textGeometry(text, settings);
    
    let mat = new MeshStandardMaterial({ flatShading: true, color: color || new Color("white") });
    return new Mesh(geo, mat);
  }
}