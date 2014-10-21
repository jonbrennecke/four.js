var FOUR = FOUR || {};


FOUR.DeferWithScene = function () {
	this.sceneAsync = $.Deferred(); 
}

FOUR.DeferWithScene.prototype = {
	resolveScene : function ( scene ) {
		this.sceneAsync.resolve(scene);
		return this;
	}
}


/**
 * /////////////////////////////////////////////////////////////////////////////////
 *
 * Shader definitions
 *
 *
 * objects:
 * 		DepthOfFieldShader - depth of field shader
 * 
 *
 * /////////////////////////////////////////////////////////////////////////////////
 */


/**
 * /////////////////////////////////////////////////////////////////////////////////
 *
 *
 * SHADER
 *
 *
 * /////////////////////////////////////////////////////////////////////////////////
 */
FOUR.Shader = function () {
	FOUR.DeferWithScene.call(this);
	
	this.height = 0;
	this.width = 0;

	this.sceneAsync.then(function(scene){
		this.setSize(scene.width,scene.height);
	}.bind(this));
};
FOUR.Shader.prototype = Object.create(FOUR.DeferWithScene.prototype);

FOUR.Shader.prototype.setSize = function ( width, height ) {
	this.width = width; this.height = height;
}

FOUR.Shader.prototype.update = function () { /* Virtual function - reimplement in inheriting classes */ return this; }



/**
 * /////////////////////////////////////////////////////////////////////////////////
 *
 *
 * DEPTH OF FIELD SHADER
 *
 * :inheritance inherits from FOUR.Shader
 *
 * /////////////////////////////////////////////////////////////////////////////////
 */
FOUR.DepthOfFieldShader = function () {

	FOUR.Shader.call(this);

	this.uniforms = {
		tDepth : { type: "t", texture: null },
		tRender : { type: "t", texture: null },
		znear : { type: "f", value : 0 },
		zfar : { type: "f", value : 0 },
		iResolution : { type: "v2", value : new THREE.Vector2(this.width,this.height) },
		focalDepth : { type: "f", value: 10.5 },
		focalLength : { type: "f", value: 2.5 },
		fstop: { type: "f", value: 0.5 },
		dithering : { type: "f", value: 0.0001 },
		maxblur : { type: "f", value: 4.0 },
		threshold : { type: "f", value: 4 },
		gain : { type: "f", value: 1.0 },
		bias : { type: "f", value: 1.0 },
		fringe : { type: "f", value: 7 },
	};

	this.vertexShader = $("#four--shader-depth-vs")[0].innerText;
	this.fragmentShader = $("#four--shader-depth-fs")[0].innerText;

	this.depthMaterial = new THREE.MeshDepthMaterial();
	this.renderTarget = new THREE.WebGLRenderTarget(
		this.width, 
		this.height, {
			minFilter: THREE.LinearFilter, 
			magFilter: THREE.LinearFilter, 
			format: THREE.RGBAFormat, 
			stencilBufer: false 
		});

	this.sceneAsync.then(function(scene){
		this.uniforms.znear.value = scene.camera.near;
		this.uniforms.zfar.value = scene.camera.far;
		this.uniforms.iResolution.value = new THREE.Vector2(this.width,this.height);
		this.renderTarget.setSize(this.width,this.height);
	}.bind(this));
	
	
};
FOUR.DepthOfFieldShader.prototype = Object.create(FOUR.Shader.prototype);

/**
 *
 * render depth data to a buffer and use the depth buffer to generate a blur
 *
 */
FOUR.DepthOfFieldShader.prototype.update = function () {
	this.sceneAsync.then(function(scene){
		scene.overrideMaterial = this.depthMaterial;
		// scene.renderer.renderer.render( 
		// 	this.scene, 
		// 	this.scene.camera, 
		// 	this.renderTarget, 
		// 	true
		// );
	}.bind(this));
	
}



