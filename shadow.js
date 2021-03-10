/*

# class ShadowVolumeMesh

- setLight()
- setShadowBias()
- setShadowDistance()

*
* usage:
*
* 1. create shadow meshes of all objects that cast shadows:
* 
*** let light = new THREE.DirectionalLight();
***
*** let geo = object.geometry;
*** 
*** let shadow = new ShadowVolumeMesh(geo);
*** shadow.setLight(light);
*
*
* 2. render scene using static renderWithShadows() method, instead of render
*
*** let shadowIntensity = 0.5; // 0.0 is no shadow, 1.0 turns of light completely for shadows
***
*** ShadowVolumeMesh.renderWithShadows(renderer, renderer.getContext(), scene, camera, light, shadowIntensity);
*
*
* 3. Done :)

*/


import { Vector3, BufferAttribute, UniformsUtils, Vector4, ShaderMaterial, ShaderLib, Group, FrontSide, DoubleSide, LessDepth, BackSide, Mesh } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/110/three.module.js';

const v0 = new Vector3();
const v1 = new Vector3();
const v2 = new Vector3();
const v01 = new Vector3();
const v12 = new Vector3();
const norm = new Vector3();

function vecToString( v, multiplier ) {
	const x = ~ ~ ( v.x * multiplier );
	const y = ~ ~ ( v.y * multiplier );
	const z = ~ ~ ( v.z * multiplier );

	return `${ x },${ y },${ z }`;
}

function getDynamicShadowVolumeGeometry( geometry ) {
	const shadowGeom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
	for ( const key in shadowGeom.attributes ) {

		shadowGeom.attributes[ key ] = shadowGeom.attributes[ key ].clone();

	}

	// Generate per-face normals
	const posAttr = shadowGeom.getAttribute( 'position' );
	const normArr = [];
	for ( let i = 0, l = posAttr.count; i < l; i += 3 ) {

		v0.x = posAttr.getX( i + 0 );
		v0.y = posAttr.getY( i + 0 );
		v0.z = posAttr.getZ( i + 0 );

		v1.x = posAttr.getX( i + 1 );
		v1.y = posAttr.getY( i + 1 );
		v1.z = posAttr.getZ( i + 1 );

		v2.x = posAttr.getX( i + 2 );
		v2.y = posAttr.getY( i + 2 );
		v2.z = posAttr.getZ( i + 2 );

		v01.subVectors( v0, v1 );
		v12.subVectors( v1, v2 );

		norm.crossVectors( v01, v12 ).normalize();

		normArr.push( norm.x, norm.y, norm.z );
		normArr.push( norm.x, norm.y, norm.z );
		normArr.push( norm.x, norm.y, norm.z );

	}
  
	const normAttr = new BufferAttribute( new Float32Array( normArr ), 3, false );
	shadowGeom.setAttribute( 'normal', normAttr );

	// generate an edge map
	const vertHash = {};
	const vertMap = {};
	for ( let i = 0, l = posAttr.count; i < l; i ++ ) {

		let str = '';
		str += posAttr.getX( i ).toFixed( 3 ) + ',';
		str += posAttr.getY( i ).toFixed( 3 ) + ',';
		str += posAttr.getZ( i ).toFixed( 3 );

		if ( str in vertHash ) {

			vertMap[ i ] = vertHash[ str ];
			vertMap[ vertHash[ str ] ] = i;

		} else {

			vertHash[ str ] = i;

		}

	}

	// generate the new index array
	const indexArr = new Array( posAttr.count ).fill().map( ( e, i ) => i );
	const edgeHash = {};
	const multiplier = 1e3;
	for ( let i = 0, l = posAttr.count; i < l; i += 3 ) {

		for ( let j = 0; j < 3; j ++ ) {

			const e00 = i + j;
			const e01 = i + ( j + 1 ) % 3;

			v0.x = posAttr.getX( e00 );
			v0.y = posAttr.getY( e00 );
			v0.z = posAttr.getZ( e00 );

			v1.x = posAttr.getX( e01 );
			v1.y = posAttr.getY( e01 );
			v1.z = posAttr.getZ( e01 );

			let str0 = vecToString( v0, multiplier );
			let str1 = vecToString( v1, multiplier );

			let hash0 = `${ str0 }|${ str1 }`;
			let hash1 = `${ str1 }|${ str0 }`;

			if ( hash0 in edgeHash || hash1 in edgeHash ) {

				const [ e10, e11 ] = edgeHash[ hash0 ];

				delete edgeHash[ hash0 ];
				delete edgeHash[ hash1 ];

				indexArr.push( e00 );
				indexArr.push( e11 );
				indexArr.push( e10 );

				indexArr.push( e00 );
				indexArr.push( e10 );
				indexArr.push( e01 );

			} else {

				edgeHash[ hash0 ] = [ e00, e01 ];
				edgeHash[ hash1 ] = [ e00, e01 ];

			}

		}

    }
  
	const indexAttr = new BufferAttribute( new Uint32Array( indexArr ), 1, false );
	shadowGeom.setIndex( indexAttr );

	return shadowGeom;

}

function shadowVolumeShaderMixin( shader ) {

	const newShader = Object.assign( {}, shader );
	newShader.uniforms = UniformsUtils.merge( [ {
		lightInfo: {
			value: new Vector4()
		},
		shadowDistance: {
			value: 1
		},
		shadowBias: {
			value: 0.01
		}
	}, shader.uniforms ] );

	// TODO: We may need the world normal matrix for this

	newShader.vertexShader =
		`
		uniform vec4 lightInfo;
		uniform float shadowDistance;
		uniform float shadowBias;
		${ newShader.vertexShader }
		`
			.replace( /#ifdef USE_ENVMAP([\s\S]+)?#endif/, ( v, match ) => match )
			.replace( /<project_vertex>/, v =>
				`${v}
				{
					vec4 projVec;
					projVec.xyz = (viewMatrix * lightInfo).xyz;

					projVec.xyz = normalize(projVec.xyz);
					projVec.w = 0.0;
					projVec = -projVec;

					float facing = dot(projVec.xyz, transformedNormal);
					float dist = step(0.0, facing) * shadowDistance + shadowBias;
					mvPosition.xyz += dist * projVec.xyz;
					gl_Position = projectionMatrix * mvPosition;
				}
			` );
	return newShader;

}

export class ShadowVolumeMaterial extends ShaderMaterial {

	constructor( source = ShaderLib.basic ) {
		super( shadowVolumeShaderMixin( source ) );
	}

	setLight( light ) {
		// TODO: get position in world space
		const vec = this.uniforms.lightInfo.value;
		if ( light.isPointLight ) {
			vec.copy( light.position );
			vec.w = 1.0;
		} else {
			vec.copy( light.position ).sub( light.target.position );
			vec.w = 0.0;
		}
	}

	setShadowDistance( dist ) {
		this.uniforms.shadowDistance.value = dist;
	}

	setShadowBias( bias ) {
		this.uniforms.shadowBias.value = bias;
	}

	clone() {
		const newMat = new ShadowVolumeMaterial();
		newMat.copy( this );
		return newMat;
	}
}

const shadowLayer = 13;

export class ShadowVolumeMesh extends Mesh {
  constructor(geometry) {
  	const shadowVolumeGeometry = getDynamicShadowVolumeGeometry( geometry );
    
    const shadowMaterial = new ShadowVolumeMaterial();
    shadowMaterial.side = DoubleSide;
	shadowMaterial.colorWrite = false;
	shadowMaterial.depthWrite = false;
    shadowMaterial.depthFunc = LessDepth;
    
    super(shadowVolumeGeometry, shadowMaterial);
    
    this.isVolumeShadow = true;
    this.frustumCulled = false;
    this.layers.set(shadowLayer);
  }
  
  setLight(light) {
    this.material.setLight(light);
  }
  
  setShadowDistance(distance) {
    this.material.setShadowDistance(distance);
  }
  
  setShadowBias(bias) {
    this.material.setShadowBias(bias);
  }
  
  static renderWithShadows(rend, gl, scene, cam, light, shadowIntensity) {
    //const gl = rend.getContext();
    shadowIntensity = shadowIntensity || 1;
    
    // turn down lights and render scene (all in shadow)
    let oldLightIntensity = light.intensity;
    light.intensity *= (1.0 - shadowIntensity);

    rend.render(scene, cam);

    // only render shadows
    cam.layers.enable(shadowLayer);
    cam.layers.disable(0);
    
    if(rend.stereo != undefined) {
      rend.stereo.cameraL.layers.enable(shadowLayer);
      rend.stereo.cameraL.layers.disable(0);
      
      rend.stereo.cameraR.layers.enable(shadowLayer);
      rend.stereo.cameraR.layers.disable(0);
    }
    
    // render shadows to stencil map
    gl.enable(gl.STENCIL_TEST);
    
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);

    gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.DECR_WRAP, gl.KEEP);
    gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.INCR_WRAP, gl.KEEP);

    rend.render(scene, cam);

    // stencil map is 0 for areas that are not in shadow
    gl.stencilFunc(gl.EQUAL, 0, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

    // reenable lights
    light.intensity = oldLightIntensity;
    
    // render light area (render part of scene not in shadow)
    cam.layers.disable(shadowLayer);
    cam.layers.enable(0);
    
    if(rend.stereo != undefined) {
      rend.stereo.cameraL.layers.enable(0);
      rend.stereo.cameraL.layers.disable(shadowLayer);
      
      rend.stereo.cameraR.layers.enable(0);
      rend.stereo.cameraR.layers.disable(shadowLayer);
    }

    rend.render(scene, cam);
    
    gl.disable(gl.STENCIL_TEST);
  }
}