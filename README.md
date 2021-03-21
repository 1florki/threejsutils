# threejsutils

utility classes for three.js

## use example

### gradient

```javascript
let c1 = Gradient.color("red"), c2 = Gradient.color("blue);
let gradient1 = Gradient.between([c1, c2]);

let cs1 = Gradient.colorStop(0.5, "green"), cs2 = Gradient.colorStop(2, "yellow");
let gradient2 = Gradient.stop([cs1, cs2]);

let v = gradient1.get(0.3);
```

### gltf

```javascript
// use callback to process models
let helper = new GLTFHelper({car: "carModel.gltf", map: "map.gltf"}, (models) => {
  let car = models.car;
  let map = models.map;
  // add models to scene here etc
});

// or add directly to some node when loaded
let myNode = new THREE.Object3D();
helper.load("skybox.gltf", "skybox", myNode, new THREE.Vector3(1, 2, 0));

```

### shadow

```javascript
let object = // some object with geometry
let light = new THREE.DirectionalLight();

let shadow = new ShadowVolumeMesh(object.geometry);
shadow.setLight(light);
object.add(shadow);

// render with 50 % intensity
ShadowVolumeMesh.renderWithShadows(renderer, renderer.getContext(), scene, camera, light, 0.5);
```

### stereo

```javascript
let effect = new StereoEffect(renderer);
effect.aspect = window.innerWidth / window.innerHeight
effect.setEyeSeparation(0.2)
effect.setSize(window.innerWidth, window.innerHeight);

// render
effect.render(camera, scene);
```

### gradient

create with either {between: [array of colors]} or Gradient.between([array]) for even spacing between 0 and 1

or

{stops: [array of color stops {stop: n, color: c}] or Gradient.stops([array])


Create colors either with new THREE.Color() or the static Gradient.color() like so:

```javascript
let color1 = Gradient.color(0.5, 0, 0);
let color2 = Gradient.color("blue");
let color3 = Gradient.color(0x04bb55);

let gradient1 = new Gradient.between([color1, color2, color3]); 
```

gradient between 

0.0 for color1 -> 0.5 for color2 -> 1.0 for color3


Create color stops either by making your own object with "stop" and "color" key/value pairs or by calling Gradint.colorStop() like so:

```javascript
let stop1 = Gradient.colorStop(0.5, "red");
let stop2 = Gradient.colorStop(0.8, 0, 1, 0); // bright green
let stop3 = Gradient.colorStop(1.3, 0xccbb22);

let gradient2 = Gradient.stop([stop1, stop2, stop3]);
```

Get color for value by calling either get(n) or getColor(n)

```javascript
gradient1.get(0.0) // returns color1

gradient2.getColor(0.7) // mix between red (stop1) and green (stop2)
```
