window.addEventListener("load" , init);
window.addEventListener("resize" , resize);
let nextBtn = document.querySelector('#next-btn')

import * as THREE from '../../node_modules/three/build/three.module.js';

let particlesScene, camera, renderer, sphere, clock, controls;

function init()
{
    particlesScene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100)
    camera.position.x = 0
    camera.position.y = 0
    camera.position.z = 2
    particlesScene.add(camera)
    renderer = new THREE.WebGLRenderer()
    renderer.setSize( window.innerWidth, window.innerHeight );
    clock = new THREE.Clock()
    // controls = new OrbitControls();
    createScene()
    tick()
}

function createScene()
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

    document.body.appendChild(renderer.domElement)
}



function resize()
{

    renderer.setSize( window.innerWidth, window.innerHeight );
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

const tick = () =>
{

    const elapsedTime = clock.getElapsedTime()

    // Update objects
    sphere.rotation.y = .5 * elapsedTime

    // Update Orbital Controls
    // controls.update()

    // Render
    renderer.render(particlesScene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}
