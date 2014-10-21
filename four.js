var FOUR = FOUR || {};


/**
 * /////////////////////////////////////////////////////////////////////////////////
 *
 * 
 * COMPOSITOR
 *
 * inherits from THREE.EffectComposer (from effects.js)
 *
 * :param renderer - instance of 'FOUR.Renderer' 
 *
 * /////////////////////////////////////////////////////////////////////////////////
 */
FOUR.Compositor = function ( scene ) {
	var renderTargetParameters = { 
			minFilter: THREE.LinearFilter, 
			magFilter: THREE.LinearFilter, 
			format: THREE.RGBAFormat, 
			stencilBufer: false
		},
		renderTarget = new THREE.WebGLRenderTarget(
			scene.width, 
			scene.height, 
			renderTargetParameters);

	THREE.EffectComposer.call(this,scene.renderer.renderer, renderTarget);
};
FOUR.Compositor.prototype = Object.create(THREE.EffectComposer.prototype);

FOUR.Compositor.prototype.update = function () {
	for (var i = 0; i < this.passes.length; i++) {
		this.passes[i].update();
	};
	return this;
}

/**
 * /////////////////////////////////////////////////////////////////////////////////
 *
 * 
 * RENDERPASS
 *
 * inherits from THREE.RenderPass (from effects.js)
 *
 * :param shader - any of the child classes inheriting from 'FOUR.Shader'
 *
 * /////////////////////////////////////////////////////////////////////////////////
 */
FOUR.RenderPass = function () {
	FOUR.DeferWithScene.call(this);
	this.shader = undefined;

	this.sceneAsync.then(function ( scene ) {
		THREE.RenderPass.call(this,scene,scene.camera);
	}.bind(this));
};
FOUR.RenderPass.prototype = Object.create(THREE.RenderPass.prototype);
$.extend(FOUR.RenderPass.prototype,Object.create(FOUR.DeferWithScene.prototype));

FOUR.RenderPass.prototype.update = function () {
	// this.shader.update()
	return this;
}

FOUR.RenderPass.prototype.addShader = function ( shader ) {
	this.shader = shader;
	return this;
}

FOUR.RenderPass.prototype.addTo = function ( renderer ) {
	// this.sceneAsync.then(function(){
	// 	// renderer.renderCallback()

	// }.bind(this))

	renderer.onRender(function(){
		
	});
	return this;
}

/**
 * /////////////////////////////////////////////////////////////////////////////////
 *
 * 
 * RENDERER
 * 
 *
 * /////////////////////////////////////////////////////////////////////////////////
 */
FOUR.Renderer = function ( parent ) {
	this.parent = parent;

	this.compositors = [];

	THREE.WebGLRenderer.call(this,{ 
		"antialias":true, 
		"alpha":true, 
		"preserveDrawingBuffer":true
	});

}
FOUR.Renderer.prototype = Object.create(THREE.WebGLRenderer);

FOUR.Renderer.prototype.addCompositor = function ( comp ) {
	this.compositors.push(comp);
};

FOUR.Renderer.prototype.set = function ( params ) {
	this.setSize(params.width||640, params.height||480);
	this.shadowMapEnabled = params.shadows;
	this.setClearColor(params.backgroundColor, params.alpha||1);
	$( this.domElement ).appendTo(params.parent||document.body);
};


FOUR.Renderer.prototype.render = function ( scene, camera ) {
	// if ( this.compositors.length ) {
		// for (var i = 0; i < this.compositors.length; i++) {
		// 	this.compositors[i].update().render();
		// };
	// }
	// else { this.render(scene, camera); }
}




/**
 * /////////////////////////////////////////////////////////////////////////////////
 *
 *
 * SCENE
 *
 * inherits from THREE.Scene 
 * 
 * :description
 * Creates a THREE.js scene 
 *
 * /////////////////////////////////////////////////////////////////////////////////
 */
FOUR.Scene = function ( options ) {

	// parent element + width and height
	this.parent = $(options.parent || document.body);
	this.height = this.parent.height();
	this.width = this.parent.width();

	this.backgroundColor = options.backgroundColor || new THREE.Color(0x000000);

	// THREE.js scene objects
	this.camera = new THREE.PerspectiveCamera( 50, this.width / this.height, 0.1, 100 );
	this.renderer = new FOUR.Renderer(this);

	window.addEventListener('resize', this.onWindowResize.bind(this), false);

	THREE.Scene.call(this);
};
FOUR.Scene.prototype = Object.create(THREE.Scene.prototype);


FOUR.Scene.prototype.withAddons = function ( components ) {

	// trackball controls
	this.controls = components.trackballControls?(
		new THREE.TrackballControls(this.camera)):false;

	// physics with Physijs
	this.physics = (components.physijs)?{}:undefined;

	return this;
}

FOUR.Scene.prototype.withShaders = function ( shaders ) {

	for (var s of shaders) {
		var pass = new FOUR.RenderPass()
			.resolveScene(this)
			.addShader(s.resolveScene(this))
			.addTo(this.renderer);
	};

	return this;
}

FOUR.Scene.prototype.init = function () {

	this.renderer.set({
		'width' : this.width,
		'height' : this.height,
		'shadows' : true,
		'backgroundColor' : this.backgroundColor,
		'parent' : this.parent
	})

	this.camera.position.set(0,2,1);
	this.camera.lookAt(new THREE.Vector3(0,0,0)); 
	this.initControls();
	return this;
}

/**
 *
 * initialize trackball controls
 *
 */
FOUR.Scene.prototype.initControls = function () {
	if (this.controls) {
		this.controls.rotateSpeed = 1.0;
		this.controls.zoomSpeed = 1.2;
		this.controls.panSpeed = 0.8;
		this.controls.noZoom = false;
		this.controls.noPan = false;
		this.controls.staticMoving = true;
		this.controls.dynamicDampingFactor = 0.3;
		this.controls.keys = [ 65, 83, 68 ];
		// controls.addEventListener('change', setupBlurredBackground);
	}
	return this;
}

/**
 *
 * render callback
 *
 */
FOUR.Scene.prototype.animate = function () {
	requestAnimationFrame(this.animate.bind(this));
	this.controls.update();
	this.renderer.render(this, this.camera);
}

/**
 *
 * handle resizing the scene
 *
 */
FOUR.Scene.prototype.onWindowResize = function ( event ) {
	this.camera.aspect = window.innerWidth / window.innerHeight;
	this.camera.updateProjectionMatrix();
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	this.controls.handleResize();
	return this;
}