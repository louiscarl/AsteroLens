declare var math: any;
declare var $: any;

class SolarSystem {
    system: any;

    constructor() {
        $.getJSON('planets.js', (data) => {
            this.system = data;
        });
    }
}

class AsteroMath {
    static r3(x: number) {
        return math.matrix([
            [Math.cos(x), Math.sin(x), 0],
            [-Math.sin(x), Math.cos(x), 0],
            [0, 0, 1]
        ]);
    }

    static r1(x: number) {
        return math.matrix([
            [1, 0, 0],
            [0, Math.cos(x), Math.sin(x)],
            [0, -Math.sin(x), Math.cos(x)]
        ]);
    }

    static auToKm(dist) {
        return dist * 149579871;
    }

    static kmToAu(dist) {
        return dist / 149579871;
    }

    static degToRad(angle) {
        return angle / 180 * Math.PI;
    }

    static radToDeg(angle) {
        return angle / Math.PI * 180;
    }

    static toCartesian(a: number, ecc: number, inc: number, Omega: number, w: number, nu: number, U: number) {
        var p = a * ((1 - ecc) ^ 2);
        var r_pqw1 = p * Math.cos(nu) / (1 + ecc * Math.cos(nu));
        var r_pqw2 = p * Math.sin(nu) / (1 + ecc * Math.cos(nu));
        var r_pqw3 = 0;

        var r_pqw = math.matrix([r_pqw1, r_pqw2, r_pqw3]);
        var ra = math.multiply(AsteroMath.r3(-Omega), AsteroMath.r1(-inc));
        var rb = math.multiply(ra, AsteroMath.r3(-w));
        var rc = math.multiply(rb, r_pqw);

        return rc;
    }

    static pythagoras(m: number[]) {
        return Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
    }

    static sphericalToCartesian(lat: number, lon: number, r: number) {
        var latRad = AsteroMath.degToRad(lat);
        var lonRad = AsteroMath.degToRad(lon);

        var x = r * Math.cos(latRad) * Math.cos(lonRad);
        var y = r * Math.cos(latRad) * Math.sin(lonRad);
        var z = r * Math.sin(latRad);

        return [x, y, z];
    }
}

class AsteroMathTest extends AsteroMath {
    r1Test() {
        console.log(AsteroMath.r1(Math.PI / 4));
        /*var expected = math.matrix(
            [
                [1, 0, 0],
                [0, 0.7071, 0.7071],
                [0, -0.7071, 0.7071]
            ]);
        */
    }

    r3Test() {
        console.log(AsteroMath.r3(Math.PI / 4));
        /* var expected = math.matrix(
            [
                [0.7071, 0.7071, 0],
                [-0.7071, 0.7071, 0],
                [0, 0, 1]
            ]);
         */
    }

    sphericalToCartesianTest() {
        var mars = AsteroMath.sphericalToCartesian(48.7687, -0.0240, 1.469496318582);
        var marsDist = AsteroMath.pythagoras(mars);
        var expected = 1.469496318582;
        if (expected !== marsDist) {
            console.error('sphericalToCartesianTest failed!');
            console.error('result: ' + marsDist);
            console.error('expected: ' + expected);
        }
    }

    run() {
        //this.r1Test();
        //this.r3Test();
        this.sphericalToCartesianTest();
    }
}

class Renderer {
    canvas: HTMLCanvasElement;
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
    system: SolarSystem;
    freeCam: BABYLON.FreeCamera;
    oculusCam: BABYLON.OculusCamera;

    constructor() {
        this.canvas = <HTMLCanvasElement>document.getElementById("renderCanvas");
        this.engine = new BABYLON.Engine(this.canvas, true);
    }

    createScene = function () {
        this.scene = new BABYLON.Scene(this.engine);

        this.scene.clearColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        this.oculusCam = new BABYLON.OculusCamera("camera1", new BABYLON.Vector3(0, 0, 0), this.scene);
        this.oculusCam.setTarget(new BABYLON.Vector3(0, 1, 0));
        this.oculusCam.attachControl(this.canvas, true);

        this.freeCam = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, 0), this.scene);
        this.freeCam.setTarget(new BABYLON.Vector3(0, 1, 0));
        this.oculusCam.attachControl(this.canvas, true);

        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;

        this.system = new SolarSystem();

        return this.scene;
    }

    updateScene() {
        var s = this.system.system;

        var sun = BABYLON.Mesh.CreateSphere('sun', 4, 0.5, this.scene);
        var sun_mat = new BABYLON.StandardMaterial("texture1", this.scene);
        sun_mat.emissiveColor = new BABYLON.Color3(1, 1, 0);
        
        sun.material = sun_mat;
        sun.position.x = 0;
        sun.position.y = 0;
        sun.position.z = 0;
        
        for (var i = 0; i < s.length; ++i) {
            if (s[i].name) {
                var sphere = BABYLON.Mesh.CreateSphere('p' + i, 10, 0.2, this.scene);

                var mat = new BABYLON.StandardMaterial('t' + i, this.scene);
                if (s[i].cr) {
                    mat.emissiveColor = new BABYLON.Color3(s[i].cr / 255, s[i].cg / 255, s[i].cb / 255);
                } else {
                    mat.emissiveColor = new BABYLON.Color3(1, 0, 1);
                }
                if (s[i].img) {
                    mat.diffuseTexture = new BABYLON.Texture(s[i].img, this.scene);
                    mat.diffuseTexture.wrapU = 1.0;
                    mat.diffuseTexture.wrapV = 1.0;
                }
                sphere.material = mat;

                sphere.position.x = s[i].x * 2;
                sphere.position.y = s[i].y * 2;
                sphere.position.z = s[i].z * 2;
            }
        }

        var material = new BABYLON.StandardMaterial("texture1", this.scene);
        material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        //material.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7);

        var randomCoordinate = (x) => {
            var v =[Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5];
            var d = AsteroMath.pythagoras(v);

            var nx = (Math.random() + x) / d * 2;
            return [v[0] * nx, v[1] * nx, v[2] * nx];
        };

        for (var i = 0; i < 100; ++i) {
            var sphere = BABYLON.Mesh.CreateSphere('p' + i, 4, 0.05, this.scene);
            sphere.material = material;
            var c = randomCoordinate(10);
            sphere.position.x = c[0];
            sphere.position.y = c[1];
            sphere.position.z = c[2];
        }

        for (var i = 0; i < 100; ++i) {
            var sphere = BABYLON.Mesh.CreateSphere('p' + i, 4, 0.05, this.scene);
            sphere.material = material;
            var c = randomCoordinate(23);
            sphere.position.x = c[0];
            sphere.position.y = c[1];
            sphere.position.z = c[2];
        }

        document.getElementById('body-name').innerText = '';
    }

    start() {
        this.createScene();

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        // Resize
        //window.addEventListener("resize",() => {
        //    this.engine.resize();
        //});
    }

    lookAtIndex: number;

    next(e: KeyboardEvent) {
        if (e.keyCode === 37 || e.keyCode === 38 || e.keyCode === 39 || e.keyCode === 40) {
            return;
        }

        var s = this.system.system;
        if (this.lookAtIndex === undefined) {
            this.lookAtIndex = s.length - 1;
        }
        
        var cam = <BABYLON.OculusCamera>this.scene.activeCamera;

        var i = this.lookAtIndex;

        cam.setTarget(new BABYLON.Vector3(s[i].x, s[i].y, s[i].z));
        document.getElementById('body-name').innerText = s[i].name;

        this.lookAtIndex = i - 1;
        if (this.lookAtIndex < 0) {
            this.lookAtIndex = s.length - 1;
        }
    }
}

var renderer: Renderer;
window.onload = () => {
    /*
    var r = AsteroMath.toCartesian(
        AsteroMath.auToKm(1.458),
        0.223,
        AsteroMath.degToRad(10.829),
        AsteroMath.degToRad(304.401),
        AsteroMath.degToRad(178.664),
        AsteroMath.degToRad(231.40149),
        132712440018
        )._data;

    var rAu = [AsteroMath.kmToAu(r[0]), AsteroMath.kmToAu(r[1]), AsteroMath.kmToAu(r[2])];
    console.log(rAu);

    console.log(AsteroMath.pythagoras(rAu));
    */

    var mars = AsteroMath.sphericalToCartesian(48.7687, -0.0240, 1.469496318582);
    console.log(mars);
    console.log(AsteroMath.pythagoras(mars));

    var test = new AsteroMathTest();
    test.run();

    renderer = new Renderer();
    renderer.start();

    setTimeout(renderer.updateScene.bind(renderer), 1000);

    document.addEventListener('keyup', renderer.next.bind(renderer));
};

function launchFullscreen(element) {
    var document: any = window.document;
    if (!document.fullscreenElement &&
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

var rotated = false;
function rotate() {
    if (!rotated) {
        $('.ui-container').addClass('rotated');
        $('#renderCanvas').addClass('rotated');
    } else {
        $('.ui-container').removeClass('rotated');
        $('#renderCanvas').removeClass('rotated');
    }
    rotated = !rotated;
}

var oculus = true;
function change_camera() {
    if (oculus) {
        renderer.scene.activeCamera = renderer.freeCam;
        $('#ui-cam').text('CAMERA - MONO');
    } else {
        renderer.scene.activeCamera = renderer.oculusCam;
        $('#ui-cam').text('CAMERA - STEREO');
    }
    oculus = !oculus;
}

function start() {
    $('.ui-container .text').addClass('hidden');
}
