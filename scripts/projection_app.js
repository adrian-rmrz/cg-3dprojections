const { createApp } = Vue;

let app;

// Initialization function - called when web page loads
function init() {
  app = createApp({
    data() {
      return {
        view: {
          id: 'view',
          width: 800,
          height: 600,
        },
        renderer: {},
      };
    },
    methods: {
      loadNewScene() {
        let scene_file = document.getElementById('scene_file');

        let reader = new FileReader();
        reader.onload = (event) => {
          let scene = JSON.parse(event.target.result);
          this.renderer.updateScene(scene);
        };
        reader.readAsText(scene_file.files[0], 'UTF-8');
      },

      onKeyDown(event) {
        switch (event.keyCode) {
          case 37: // LEFT Arrow
            this.renderer.rotateLeft();
            break;
          case 39: // RIGHT Arrow
            this.renderer.rotateRight();
            break;
          case 65: // A key
            this.renderer.moveLeft();
            break;
          case 68: // D key
            this.renderer.moveRight();
            break;
          case 83: // S key
            this.renderer.moveBackward();
            break;
          case 87: // W key
            this.renderer.moveForward();
            break;
        }
      },
    },
  }).mount('#content');

  let initial_scene = {
    view: {
      prp: [0, 10, -5],
      srp: [20, 15, -40],
      vup: [1, 1, 0],
      clip: [-12, 6, -12, 6, 10, 100],
    },
    models: [
      {
        type: 'generic',
        vertices: [
          [0.0, 0.0, -30.0],
          [20.0, 0.0, -30.0],
          [20.0, 12.0, -30.0],
          [10.0, 20.0, -30.0],
          [0.0, 12.0, -30.0],
          [0.0, 0.0, -60.0],
          [20.0, 0.0, -60.0],
          [20.0, 12.0, -60.0],
          [10.0, 20.0, -60.0],
          [0.0, 12.0, -60.0],
        ],
        edges: [
          [0, 1, 2, 3, 4, 0],
          [5, 6, 7, 8, 9, 5],
          [0, 5],
          [1, 6],
          [2, 7],
          [3, 8],
          [4, 9],
        ],
        animation: {
          rps: 0.05,
          axis: 'y',
          //   transform: mat4x4Identity(new Matrix(4, 4)),

        },
      },
    ],
  };

  document.addEventListener('keydown', app.onKeyDown, false);

  app.renderer = new Renderer(app.view, initial_scene);
  window.requestAnimationFrame((timestamp) => {
    app.renderer.animate(timestamp);
  });
}
