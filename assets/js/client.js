
class stream {
    ROSLIB = require('roslib')

    port = 9090;
    ros = new this.ROSLIB.Ros({
        url : `ws://localhost:${this.port}`
    });
    cameraStream = new this.ROSLIB.Topic({
        ros : this.ros,
        name : '/camera/image_raw',
        messageType : 'sensor_msgs/Image'
    });
    velodynePoints = new this.ROSLIB.Topic({
        ros : this.ros,
        name : '/velodyne_points',
        messageType : 'sensor_msgs/PointCloud2'
    });
    canvas = document.createElement("canvas");
    ctx = this.canvas.getContext("2d");

    constructor() {
        this.createConnection(this.port)
            .then(this.cameraStream.subscribe((message) => this.renderFrames(message)))
            .catch((e) => {console.log(`error:${e}`)})// Initializes connection
        // .then(this.velodynePoints.subscribe(this.renderPointCloud(message)))
    }

    /**
     * Renders camera frames to canvas
     * @param message
     */
    renderFrames(message)
    {
        this.canvas.width = message.width;
        this.canvas.height = message.height;

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
        document.body.appendChild(this.canvas);
        this.cameraStream.unsubscribe();
    }

    /**
     * Create pointcloud visualisation
     */
    renderPointCloud(message)
    {
        //todo: Creates function to handle and visualize pointcloud
    }

    /**
     * Creates connection to websocket
     * @param port
     */
    createConnection(port)
    {
        return new Promise((resolve, reject) =>
        {
            this.ros.on('connection', function(port) {
                resolve(console.log(`Connected to websocket server on port ${port}.`))
            });

            this.ros.on('error', function(error, port) {
                reject(console.log(`Error connecting to websocket server:  ${port}.`, error));
            });

            this.ros.on('close', function(port) {
                reject(console.log(`Connection to websocket server closed on port ${port}`));
            });

        })



    }
}
new stream()
