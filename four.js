"use strict";
"use asm";



var FOUR = FOUR || {};



// parameters for renderTargets
FOUR.renderTargetParams = { 
	minFilter: THREE.LinearFilter, 
	magFilter: THREE.LinearFilter, 
	format: THREE.RGBAFormat, 
	stencilBufer: false 
};



// parameters for WebGLRenderer
FOUR.webGLRendererParams = { 
	antialias: true, 
	alpha: true, 
	preserveDrawingBuffer: true 
};



/**
 * ////////////////////////////////////////////////////////////////////////
 *
 *
 * SHADER
 *
 * abstract base class (Don't instantiate directly!)
 *
 *
 * ////////////////////////////////////////////////////////////////////////
 */
FOUR.Shader = function ( shader ) {
	THREE.ShaderPass.call(this,shader);
};
FOUR.Shader.prototype = Object.create(THREE.ShaderPass.prototype)



/**
 *
 * Depth of Field Shader
 *
 */
FOUR.DepthOfFieldShader = function ( scene ) {

	this.scene = scene;

	scene
		.renderer
		.onPreRender
		.progress(this.onPreRender.bind(this))
	scene
		.renderer
		.onPostRender
		.progress(this.onPostRender.bind(this))

	this.uniforms = {
		tDepth : { type: "t", texture: null },
		tRender : { type: "t", texture: null },
		znear : { type: "f", value : scene.camera.near },
		zfar : { type: "f", value : scene.camera.far },
		iResolution : { type: "v2", value : new THREE.Vector2(scene.width,scene.height) },
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

	this.depthMaterial = new THREE.MeshDepthMaterial();
	this.renderTarget = new THREE.WebGLRenderTarget(
		scene.width, 
		scene.height, 
		FOUR.renderTargetParams);

	this.vertexShader = $("#four--shader-depth-vs")[0].innerText;
	this.fragmentShader = $("#four--shader-depth-fs")[0].innerText;

	this.uniforms.tRender.value = scene.renderer.compositor.renderTarget2;
	this.uniforms.tDepth.value = this.renderTarget;

	FOUR.Shader.call(this,{
		uniforms : this.uniforms,
		vertexShader : this.vertexShader,
		fragmentShader : this.fragmentShader
	});
};
FOUR.DepthOfFieldShader.prototype = Object.create(FOUR.Shader.prototype);



/**
 *
 * called before every call to the render callback
 *
 * render depth data to a buffer
 *
 */
FOUR.DepthOfFieldShader.prototype.onPreRender = function () {
	this.scene.overrideMaterial = depth.material;
	this.scene.renderer.render(
		this.scene, 
		this.camera, 
		this.renderTarget, 
		true);
}


/**
 *
 * called after every call to the render callback
 *
 */
FOUR.DepthOfFieldShader.prototype.onPostRender = function () {}



/**
 * ////////////////////////////////////////////////////////////////////////
 *
 *
 * COMPOSITOR
 *
 *
 * ////////////////////////////////////////////////////////////////////////
 */
FOUR.Compositor = function ( renderer ) {

	this.renderer = renderer;

	// *************************************************** 
	// create a render pass
	// ***************************************************

	this.renderTarget = new THREE.WebGLRenderTarget(
		renderer.scene.width, 
		renderer.scene.height, 
		FOUR.renderTargetParams
	);

	this.renderPass = new THREE.RenderPass( 
		renderer.scene, 
		renderer.scene.camera
	);

	this.renderPass.renderToScreen = true;

	THREE.EffectComposer.call(this,renderer.__renderer,this.renderTarget);
	this.addPass(this.renderPass);
};
FOUR.Compositor.prototype = Object.create(THREE.EffectComposer.prototype);




/**
 * ////////////////////////////////////////////////////////////////////////
 *
 *
 * Renderer
 *
 *
 * ////////////////////////////////////////////////////////////////////////
 */
FOUR.Renderer = function ( scene ) {
	this.scene = scene;
	this.onPreRender = $.Deferred();
	this.onPostRender = $.Deferred();
	this.isUsingShaders = false;
	this.__renderer = new THREE.WebGLRenderer(FOUR.webGLRendererParams);
	this.__renderer.setSize(scene.width, scene.height);
	this.__renderer.shadowMapEnabled = true;
	this.__renderer.setClearColor(scene.backgroundColor, 1);
	$(this.__renderer.domElement).appendTo(scene.domElement);
	this.compositor = new FOUR.Compositor(this);
};

FOUR.Renderer.prototype = {
	
	/**
	 *
	 * 
	 *
	 */
	render : function () {
		this.onPreRender.notify();
		if ( this.isUsingShaders ) { this.compositor.render(); } 
		else { this.__renderer.render(this.scene,this.scene.camera); }
		this.onPostRender.notify();
	},


	/**
	 *
	 * 
	 *
	 */
	addShader : function ( shader ) {
		if ( ! (shader instanceof FOUR.Shader) ) { /*TODO error*/ }
		if ( !this.isUsingShaders ) {
			this.isUsingShaders = true;
			this.compositor.addPass(shader);
		}

	}
};



/**
 * ////////////////////////////////////////////////////////////////////////
 *
 *
 * Scene
 *
 * :param options - json object with the (optional) fields:
 * {
 *			
 * }
 *
 *
 * ////////////////////////////////////////////////////////////////////////
 */
FOUR.Scene = function ( options ) {
	this.domElement = $(options.parent || document.body);
	this.height = this.domElement.height();
	this.width = this.domElement.width();
	this.backgroundColor = options.backgroundColor || new THREE.Color(0x000000);
	this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 1, 10);
	this.renderer = new FOUR.Renderer(this);
	THREE.Scene.call(this);
};
FOUR.Scene.prototype = Object.create(THREE.Scene.prototype);


/**
 *
 * 
 *
 */
FOUR.Scene.prototype.animate = function () {
	// requestAnimationFrame(this.animate.bind(this));
	// this.controls.update();
	this.renderer.render();
};


/**
 *
 * :param options - array of shaders (inheriting from FOUR.Shader)
 *
 */
FOUR.Scene.prototype.withShaders = function ( shaders ) {
	for (var s of shaders) { this.renderer.addShader(new s(this)); }
	return this;
}


/**
 *
 * :param options - json object with the following options:
 *
 * {
 *		'trackballControls' : boolean,
 *		'physics' : boolean
 * }
 *
 */
FOUR.Scene.prototype.withAddons = function ( options ) {
	return this;
}


/**
 *
 * 
 *
 */
FOUR.Scene.prototype.init = function () {
	this.camera.position.set(0,2,1);
	this.camera.lookAt(new THREE.Vector3(0,0,0)); 
	// this.initControls();
	return this;
}
