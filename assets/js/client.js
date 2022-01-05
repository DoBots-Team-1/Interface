import * as THREE from '../../node_modules/three/build/three.module.js';

class stream {
    ROSLIB = require('roslib')
    port = 9090;
    // Socket connection
    ros = new this.ROSLIB.Ros({
        url : `ws://localhost:${this.port}`
    });
    // Renderer
    viewer = new ROS3D.Viewer({
        divID : 'viewer',
        background: '#ffffff',
        width : 50,
        height : 50,
        antialias : true,
        alpha : 0.1
    });
    // Camera stream topic
    cameraStream = new this.ROSLIB.Topic({
        ros : this.ros,
        name : '/camera/image_raw',
        messageType : 'sensor_msgs/Image'
    });
    // Battery stream topic
    stateStream = new this.ROSLIB.Topic({
        ros : this.ros,
        name : '/mavros/state',
        messageType : 'mavros_msgs/State'
    });
    altitudeStream = new this.ROSLIB.Topic({
        ros : this.ros,
        name : '/mavros/altitude',
        messageType : 'mavros_msgs/Altitude'
    });
    // TF Client
    tfClient = new ROSLIB.TFClient({
        ros : this.ros,
        angularThres : 0.01,
        transThres : 0.01,
        rate : 10.0,
        fixedFrame : 'base_link'
    });

    display = document.getElementById('viewer')
    cameraCanvas = document.createElement("canvas");
    ctx = this.cameraCanvas.getContext("2d");
    stateMessage = document.getElementById('state-message')
    stateSubject = document.getElementById('state-subject')
    footer = document.getElementById('footer')
    mode
    landing
    cameraRendered = false;
    window;
    loadingScreen = new THREE.WebGLRenderer()
    errorScreen = document.getElementById('error-screen')

    constructor(window) {
        this.window = window
        this.loadScreen()
        // Initializes connection
        this.createConnection(this.port)
            .then(() => this.init())
            .catch((e) => {
                this.loadingScreen.domElement.remove()
                // this.errorScreen.style.display = "flex"
                console.log(`error:${e.message}`)
            });
        // Initializes connection
        this.renderPointCloud()
            // Render camera
            .then(() => this.cameraStream.subscribe((message) => this.renderFrames(message)))
            .then(() => this.stateStream.subscribe((message) => this.droneFeedback(message)))
            .then(() => this.altitudeStream.subscribe((message) => this.altitudeFeedback(message)))
            .catch((e) => {console.log(`error:${e.message}`)});
        // const camera = new THREE.PerspectiveCamera( 45, this.cameraCanvas.width / this.cameraCanvas.height, 1, 1000 );

        this.viewer.camera.position.setY(0.020790662415651365)
        this.viewer.camera.position.setX(-0.0978123763966757)
        this.viewer.camera.position.setZ(-0.0006981260297961952)
    }

    loadScreen()
    {
        let particlesScene, camera, sphere, clock, controls;

        const createScene = () =>
        {
            // Objects
            const geometry = new THREE.TorusGeometry( .7, .2, 16, 100 );

            // Materials
            const material = new THREE.PointsMaterial({
                color: 0xff0000,
                size: 0.008

            })
            material.color = new THREE.Color(0xff0000)

            // Mesh
            sphere = new THREE.Points(geometry,material)
            particlesScene.add(sphere)

            // Lights
            const pointLight = new THREE.PointLight(0xff0000, 0.1)
            pointLight.position.x = 2
            pointLight.position.y = 3
            pointLight.position.z = 4

            // Points
            const points = new THREE.Points( geometry, material );

            particlesScene.add(pointLight)

            document.body.appendChild(this.loadingScreen.domElement)
        }

        const tick = () =>
        {

            const elapsedTime = clock.getElapsedTime()

            // Update objects
            sphere.rotation.y = .5 * elapsedTime

            // Update Orbital Controls
            // controls.update()

            // Render
            this.loadingScreen.render(particlesScene, camera)

            // Call tick again on the next frame
            window.requestAnimationFrame(tick)
        }

        particlesScene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
        camera.position.x = 0
        camera.position.y = 0
        camera.position.z = 2
        particlesScene.add(camera)
        this.loadingScreen.setSize( this.window.innerWidth, this.window.innerHeight );
        clock = new THREE.Clock()
        // controls = new OrbitControls();
        createScene()
        tick()






    }


    /**
     * Sends one request to initialize the camera stream resolution
     */
    init()
    {
        this.cameraCanvas.setAttribute('id', 'camera');
        this.display.children[0].setAttribute('id', 'lidar');
        let initCameraStream = new this.ROSLIB.Topic({
            ros : this.ros,
            name : '/camera/image_raw',
            messageType : 'sensor_msgs/Image'
        });

        initCameraStream.subscribe((message) => {
            console.info('Initializing the camera stream..');
            console.info(`Resolution:${message.width} x ${ message.height} `);
            this.viewer.renderer.setSize(this.window.innerWidth, this.window.innerHeight);
            this.cameraCanvas.width = this.window.innerWidth;
            this.cameraCanvas.height = this.window.innerHeight;

            initCameraStream.unsubscribe();
        })
    }

    /**
     * Decodes byte string data to binary and  camera frames to canvas
     * @param message
     */
    renderFrames(message)
    {
        //console.log(this.viewer.camera.position);
        const imgData = this.ctx.createImageData(message.width, message.height);
        const data = imgData.data;
        const inData = atob(message.data);

        let j = 0; let i = 4; // j data in , i data out
        while( j < inData.length) {
            const w1 = inData.charCodeAt(j++);  // read 3 16 bit words represent 1 pixel
            const w2 = inData.charCodeAt(j++);
            const w3 = inData.charCodeAt(j++);
            if (!message.is_bigendian) {
                data[i++] = w1; // red
                data[i++] = w2; // green
                data[i++] = w3; // blue
            } else {
                data[i++] = (w1 >> 8) + ((w1 & 0xFF) << 8);
                data[i++] = (w2 >> 8) + ((w2 & 0xFF) << 8);
                data[i++] = (w3 >> 8) + ((w3 & 0xFF) << 8);
            }
            data[i++] = 255;  // alpha
        }

        this.ctx.putImageData(imgData, 0, 0);
        this.display.appendChild(this.cameraCanvas);
        if(this.cameraRendered == false){
            this.footer.style.display = 'flex';
            this.cameraRendered = true;
        }
        //this.cameraStream.unsubscribe();
    }

    /**
     * Create point cloud visualisation
     * Using ROS3D Libary
     */
    async renderPointCloud()
    {
        const cloudClient = await new ROS3D.PointCloud2({
            ros: this.ros,
            topic: '/velodyne_points',
            tfClient: this.tfClient,
            rootObject: this.viewer.scene,
            material: { size: 0.05, color: 0xff00ff }
        });
    }

    altitudeFeedback(message){
        //if(this.mode !== "flying"){return}
        if(message.bottom_clearance == null && message.terrain == null && this.landing == false){
            this.mode = "flying"
            this.stateSubject.innerHTML = "Flying"
            this.stateMessage.innerHTML = "The drone is currently flying in manual mode.";
        }
    }

    droneFeedback(message) {
        if (message.armed == true && message.mode == "AUTO.LAND" && message.guided == true && this.landing == false) {
            this.stateSubject.innerHTML = "Autonomous landing";
            this.stateMessage.innerHTML = "The drone is now trying to land.";
            this.mode = "landing"
            this.landing = true
        }
        if (message.armed == true && message.mode == "OFFBOARD" && this.mode !== "flying") {
            this.stateSubject.innerHTML = "Taking off...";
            this.stateMessage.innerHTML = "The drone is now ready to take off manually";
            this.mode = "takeoff"
        }
        if (message.armed == false && message.mode== "AUTO.LAND") {
            this.stateSubject.innerHTML = "Landed";
            this.stateMessage.innerHTML = "The drone has succesfully landed!";
            this.mode = "landed"
            this.landing = false
        }

        //console.log(this.stateMessage.innerHTML = mode)

        //this.stateStream.unsubscribe()
    }

    /**
     * Creates connection to websocket
     * @param port
     */
    createConnection(port)
    {
        //todo: passing port number to console log
        return new Promise((resolve, reject) =>
        {
            this.ros.on('connection', function() {
                console.log(`Connected to websocket server.`)
                resolve()
            });

            this.ros.on('error', function(error, port) {
                console.log(`Error connecting to websocket server.`, error)
                reject()
            });

            this.ros.on('close', function(port) {
                console.log(`Connection to websocket server closed.`)
                reject()
            });

        })
    }
}
new stream(window)
