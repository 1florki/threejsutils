/*

class Gradient (v2 of Color1D)

create with either {between: [array of colors]}
or Gradient.between([array])
for even spacing between 0 and 1

or

{stops: [array of color stops {stop: n, color: c}]
or Gradient.stops([array])


Create colors either with new THREE.Color() or the 
static Gradient.color() like so:

let color1 = Gradient.color(0.5, 0, 0);
let color2 = Gradient.color("blue");
let color3 = Gradient.color(0x04bb55);

let gradient1 = new Gradient.between([color1, color2, color3]); 

gradient between 
0.0 for color1 -> 0.5 for color2 -> 1.0 for color3


Create color stops either by making your own object with the 
fitting "stop" and "color" key/value pairs or by calling 
Gradint.colorStop() like so:

let stop1 = Gradient.colorStop(0.5, "red");
let stop2 = Gradient.colorStop(0.8, 0, 1, 0); // bright green
let stop3 = Gradient.colorStop(1.3, 0xccbb22);

let gradient2 = Gradient.stop([stop1, stop2, stop3]);


Get color for value by calling either get(n) or getColor(n)

gradient1.get(0.0) // returns color1
gradient2.getColor(0.7) // mix between red (stop1) and green (stop2)


*/

import { Color } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js';


export class Gradient {
  constructor(opts) {
    opts = opts || {};
    
    this.colors = [];
    this.hsl = opts.hsl || false;
    
    if(opts.stops) this.addArray(opts.stops);
    if(opts.between) this.addBetween(opts.between);
  }
  
  addStops(arr) {
    for(let s of arr) {
      this.addStop(s)
    }
  }
  
  addBetween(arr) {
    for(let i = 0; i < arr.length; i++) {
      let c = arr[i];
      if(!(c instanceof Color)) {
        c = Gradient.color(c);
      }
      this.addStop(Gradient.colorStop(i / (arr.length - 1), c));
    }
  }
  
  addStop(c) {
    let i = 0;
    while(i < this.colors.length && c.stop > this.colors[i].stop) {
      i++;
    }
    this.colors.splice(i, 0, c);
  }

  mix(i, j, amt) {
    if(i < 0 || i >= this.colors.length || j < 0 || j >= this.colors.length) return undefined;
    
    let c = this.colors[i].color.clone();
    if(i == j) return c;
    
    if(this.hsl) c.lerpHSL(this.colors[j].color, amt);
    else c.lerp(this.colors[j].color, amt);
    
    return c;
  }
  
  get(v) {
    return this.getColor(v);
  }
  
  getColor(v) {
    if(this.colors.length < 1) return undefined;
    
    if(v < this.colors[0].stop) return this.colors[0].clone();
    
    for(let i = 0; i < this.colors.length - 1; i++) {
      let s1 = this.colors[i].stop, s2 = this.colors[i + 1].stop;
      if(s1 < v && v < s2) {
        let amt = (v - s1) / (s2 - s1);
        return this.mix(i, i + 1, amt);
      }
    }
    return this.mix(this.colors.length - 1, this.colors.length - 1, 0)
  }
  
  static between(arr) {
    return new Gradient({between: arr});
  }
  static stops(arr) {
    return new Gradient({stops: arr});
  }
  static color(r, g, b) {
    if(g != undefined) return new Color(r, g, b);
    else return new Color(r);
  }
  static colorStop(stop, r, g, b) {
    return {stop: stop, color: Gradient.color(r, g, b)};
  }
}
