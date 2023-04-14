const LEFT = 32; // binary 100000
const RIGHT = 16; // binary 010000
const BOTTOM = 8; // binary 001000
const TOP = 4; // binary 000100
const FAR = 2; // binary 000010
const NEAR = 1; // binary 000001
const FLOAT_EPSILON = 0.000001;

class Renderer {
  // canvas:              object ({id: __, width: __, height: __})
  // scene:               object (...see description on Canvas)
  constructor(canvas, scene) {
    this.canvas = document.getElementById(canvas.id);
    this.canvas.width = canvas.width;
    this.canvas.height = canvas.height;
    this.ctx = this.canvas.getContext('2d');
    this.scene = this.processScene(scene);
    this.enable_animation = true; // <-- disabled for easier debugging; enable for animation
    this.start_time = null;
    this.prev_time = null;
  }

  //
  updateTransforms(time, delta_time) {
    // TODO: update any transformations needed for animation
    for (let i = 0; i < this.scene.models.length; i++) {
      if (this.scene.models[i].hasOwnProperty('animation')) {
        //find center
        let center;
        if (this.scene.models[i].type === 'generic') {
          center = this.findCenter(this.scene.models[i].vertices);
        } else {
          console.log('else center: ');
          console.log(this.scene.models[i].center);
          center = this.scene.models[i].center;
        }
        //components of transfrom matrix
        let translateToOrigin = new Matrix(4, 4);
        let translateFromOrigin = new Matrix(4, 4);
        let rotate = new Matrix(4, 4);
        // console.log(center);

        //translations to and from origin
        mat4x4Translate(translateToOrigin, -center.x, -center.y, -center.z);
        mat4x4Translate(translateFromOrigin, center.x, center.y, center.z);

        //how far to rotate
        let revs = (this.scene.models[i].animation.rps * time) / 1000;
        if (this.scene.models[i].animation.axis == 'x') {
          mat4x4RotateX(rotate, revs * (2 * Math.PI));
        } else if (this.scene.models[i].animation.axis == 'y') {
          mat4x4RotateY(rotate, revs * (2 * Math.PI));
        } else {
          mat4x4RotateZ(rotate, revs * (2 * Math.PI));
        }

        //final translate matrix
        this.scene.models[i].animation.transform = Matrix.multiply([translateFromOrigin, rotate, translateToOrigin]);
      }
    }
  }

  //
  rotateLeft() {
    console.log(this.scene.view.prp);
    let n = Vector3(
      this.scene.view.srp.x - this.scene.view.prp.x,
      this.scene.view.srp.y - this.scene.view.prp.y,
      this.scene.view.srp.z - this.scene.view.prp.z
    );
    n.normalize();
    console.log(n);

    let vup = Vector3(this.scene.view.vup.x, this.scene.view.vup.y, this.scene.view.vup.z);
    let cross = vup.cross(n);
    cross.normalize();
    let u = Vector3(cross.x, cross.y, cross.z);
    u.normalize();

    this.scene.view.srp.x += u.x;
    this.scene.view.srp.y += u.y;
    this.scene.view.srp.z += u.z;
  }

  //
  rotateRight() {
    console.log(this.scene.view.prp);
    let n = Vector3(
      this.scene.view.prp.x - this.scene.view.srp.x,
      this.scene.view.prp.y - this.scene.view.srp.y,
      this.scene.view.prp.z - this.scene.view.srp.z
    );
    n.normalize();
    console.log(n);

    let vup = Vector3(this.scene.view.vup.x, this.scene.view.vup.y, this.scene.view.vup.z);
    let cross = vup.cross(n);
    cross.normalize();
    // console.log('cross');
    // console.log(cross);
    let u = Vector3(cross.x, cross.y, cross.z);
    // u.normalize();

    this.scene.view.srp.x += u.x;
    this.scene.view.srp.y += u.y;
    this.scene.view.srp.z += u.z;
  }

  // A key is pressed
  moveLeft() {
    console.log('left');
    console.log('PRP Before: ' + this.scene.view.prp.values);

    // Rotate VRC such that (u,v,n) align with (x,y,z)
    let rotV = rotateVRC(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup);

    // Create translate matrix
    let leftMat = new Matrix(4, 4);
    mat4x4Translate(leftMat, -1 * rotV.values[0][0], -1 * rotV.values[0][1], -1 * rotV.values[0][2]);
    console.log('leftMat after: ' + leftMat.values);

    // Convert PRP and SRP to 4x1 matrix to multiply
    let prp4 = new Matrix(4, 1);
    prp4.values = [
      [this.scene.view.prp.values[0]],
      [this.scene.view.prp.values[1]],
      [this.scene.view.prp.values[2]],
      [1],
    ];

    let srp4 = new Matrix(4, 1);
    srp4.values = [
      [this.scene.view.srp.values[0]],
      [this.scene.view.srp.values[1]],
      [this.scene.view.srp.values[2]],
      [1],
    ];

    // Multiply PRP and SRP by transform matrix
    prp4 = leftMat.mult(prp4);
    srp4 = leftMat.mult(srp4);

    console.log('PRP4 After: ' + prp4.values);

    // Set transformed PRP and SRP values
    this.scene.view.prp.values = [
      [prp4.values[0][0] / prp4.values[3][0]],
      [prp4.values[1][0] / prp4.values[3][0]],
      [prp4.values[2][0] / prp4.values[3][0]],
    ];

    console.log('SRP4 After: ' + srp4.values);
    this.scene.view.srp.values = [
      [srp4.values[0][0] / srp4.values[3][0]],
      [srp4.values[1][0] / srp4.values[3][0]],
      [srp4.values[2][0] / srp4.values[3][0]],
    ];

    console.log('PRP After: ' + this.scene.view.prp.values);
    console.log('SRP After: ' + this.scene.view.srp.values);

    this.draw();
  }

  // D key is pressed
  moveRight() {
    console.log('right');
    console.log('PRP Before: ' + this.scene.view.prp.values);

    // Rotate VRC such that (u,v,n) align with (x,y,z)
    let rotV = rotateVRC(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup);

    // Create translate matrix
    let rightMat = new Matrix(4, 4);
    mat4x4Translate(rightMat, rotV.values[0][0], rotV.values[0][1], rotV.values[0][2]);
    console.log('rightMat after: ' + rightMat.values);

    // Convert PRP and SRP to 4x1 matrix to multiply
    let prp4 = new Matrix(4, 1);
    prp4.values = [
      [this.scene.view.prp.values[0]],
      [this.scene.view.prp.values[1]],
      [this.scene.view.prp.values[2]],
      [1],
    ];

    let srp4 = new Matrix(4, 1);
    srp4.values = [
      [this.scene.view.srp.values[0]],
      [this.scene.view.srp.values[1]],
      [this.scene.view.srp.values[2]],
      [1],
    ];

    // Multiply PRP and SRP by transform matrix
    prp4 = rightMat.mult(prp4);
    srp4 = rightMat.mult(srp4);

    console.log('PRP4 After: ' + prp4.values);

    // Set transformed PRP and SRP values
    this.scene.view.prp.values = [
      [prp4.values[0][0] / prp4.values[3][0]],
      [prp4.values[1][0] / prp4.values[3][0]],
      [prp4.values[2][0] / prp4.values[3][0]],
    ];

    console.log('SRP4 After: ' + srp4.values);
    this.scene.view.srp.values = [
      [srp4.values[0][0] / srp4.values[3][0]],
      [srp4.values[1][0] / srp4.values[3][0]],
      [srp4.values[2][0] / srp4.values[3][0]],
    ];

    console.log('PRP After: ' + this.scene.view.prp.values);
    console.log('SRP After: ' + this.scene.view.srp.values);

    this.draw();
  }

  // S key is pressed
  moveBackward() {
    console.log('forward');
    console.log('PRP Before: ' + this.scene.view.prp.values);

    // Rotate VRC such that (u,v,n) align with (x,y,z)
    let rotV = rotateVRC(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup);

    // Create translate matrix
    let backMat = new Matrix(4, 4);
    mat4x4Translate(backMat, -1 * rotV.values[2][0], -1 * rotV.values[2][1], -1 * rotV.values[2][2]);
    console.log('backMat after: ' + backMat.values);

    // Convert PRP and SRP to 4x1 matrix to multiply
    let prp4 = new Matrix(4, 1);
    prp4.values = [
      [this.scene.view.prp.values[0]],
      [this.scene.view.prp.values[1]],
      [this.scene.view.prp.values[2]],
      [1],
    ];

    let srp4 = new Matrix(4, 1);
    srp4.values = [
      [this.scene.view.srp.values[0]],
      [this.scene.view.srp.values[1]],
      [this.scene.view.srp.values[2]],
      [1],
    ];

    // Multiply PRP and SRP by transform matrix
    prp4 = backMat.mult(prp4);
    srp4 = backMat.mult(srp4);

    console.log('PRP4 After: ' + prp4.values);

    // Set transformed PRP and SRP values
    this.scene.view.prp.values = [
      [prp4.values[0][0] / prp4.values[3][0]],
      [prp4.values[1][0] / prp4.values[3][0]],
      [prp4.values[2][0] / prp4.values[3][0]],
    ];

    console.log('SRP4 After: ' + srp4.values);
    this.scene.view.srp.values = [
      [srp4.values[0][0] / srp4.values[3][0]],
      [srp4.values[1][0] / srp4.values[3][0]],
      [srp4.values[2][0] / srp4.values[3][0]],
    ];

    console.log('PRP After: ' + this.scene.view.prp.values);
    console.log('SRP After: ' + this.scene.view.srp.values);

    this.draw();
  }

  // W key is pressed
  moveForward() {
    console.log('backward');
    console.log('PRP Before: ' + this.scene.view.prp.values);

    // Rotate VRC such that (u,v,n) align with (x,y,z)
    let rotV = rotateVRC(this.scene.view.prp, this.scene.view.srp, this.scene.view.vup);

    // Create translate matrix
    let foreMat = new Matrix(4, 4);
    mat4x4Translate(foreMat, rotV.values[2][0], rotV.values[2][1], rotV.values[2][2]);
    console.log('foreMat after: ' + foreMat.values);

    // Convert PRP and SRP to 4x1 matrix to multiply
    let prp4 = new Matrix(4, 1);
    prp4.values = [
      [this.scene.view.prp.values[0]],
      [this.scene.view.prp.values[1]],
      [this.scene.view.prp.values[2]],
      [1],
    ];

    let srp4 = new Matrix(4, 1);
    srp4.values = [
      [this.scene.view.srp.values[0]],
      [this.scene.view.srp.values[1]],
      [this.scene.view.srp.values[2]],
      [1],
    ];

    // Multiply PRP and SRP by transform matrix
    prp4 = foreMat.mult(prp4);
    srp4 = foreMat.mult(srp4);

    console.log('PRP4 After: ' + prp4.values);

    // Set transformed PRP and SRP values
    this.scene.view.prp.values = [
      [prp4.values[0][0] / prp4.values[3][0]],
      [prp4.values[1][0] / prp4.values[3][0]],
      [prp4.values[2][0] / prp4.values[3][0]],
    ];

    console.log('SRP4 After: ' + srp4.values);
    this.scene.view.srp.values = [
      [srp4.values[0][0] / srp4.values[3][0]],
      [srp4.values[1][0] / srp4.values[3][0]],
      [srp4.values[2][0] / srp4.values[3][0]],
    ];

    console.log('PRP After: ' + this.scene.view.prp.values);
    console.log('SRP After: ' + this.scene.view.srp.values);

    this.draw();
  }

  //
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    console.log('draw()');
    // console.log(this.scene);

    // TODO: implement drawing here!
    // For each model
    //   * For each vertex
    //     * transform endpoints to canonical view volume
    //   * For each line segment in each edge
    //     * clip in 3D
    //     * project to 2D
    //     * translate/scale to viewport (i.e. window)
    //     * draw line

    //model index
    let idx = 0;
    // transform to cannonical view volume
    let cannonical = mat4x4Perspective(
      this.scene.view.prp,
      this.scene.view.srp,
      this.scene.view.vup,
      this.scene.view.clip
    );

    for (idx = 0; idx < this.scene.models.length; idx++) {
      let cannonical_vertices = [];
      let shapeVertices = [];
      let shapeEdges = [];
      let shapeChar = this.scene.models[idx];

      if (shapeChar.type != 'generic') {
        let shape;

        if (shapeChar.type == 'cube') {
          shape = this.generateCube(shapeChar.center, shapeChar.width, shapeChar.height, shapeChar.depth);
          shapeVertices = shape.vertices;
          shapeEdges = shape.edges;
        }
        if (shapeChar.type == 'cone') {
          shape = this.generateCone(shapeChar.center, shapeChar.radius, shapeChar.height, shapeChar.sides);
          shapeVertices = shape.vertices;
          shapeEdges = shape.edges;
        }
        if (shapeChar.type == 'cylinder') {
          shape = this.generateCylinder(shapeChar.center, shapeChar.radius, shapeChar.height, shapeChar.sides);
          shapeVertices = shape.vertices;
          shapeEdges = shape.edges;
        }
        if (shapeChar.type == 'sphere') {
          shape = this.generateSphere(shapeChar.center, shapeChar.radius, shapeChar.slices, shapeChar.stacks);
          shapeVertices = shape.vertices;
          shapeEdges = shape.edges;
        }
      } else {
        shapeVertices = shapeChar.vertices;
        shapeEdges = shapeChar.edges;
      }

      //apply to vertices
      for (let i = 0; i < shapeVertices.length; i++) {
        let vertex = Vector4(shapeVertices[i].x, shapeVertices[i].y, shapeVertices[i].z, shapeVertices[i].w);
        if (shapeChar.hasOwnProperty('animation')) {
          let animation = shapeChar.animation.transform;
          cannonical_vertices[i] = Matrix.multiply([cannonical, animation, vertex]);
        } else {
          cannonical_vertices[i] = Matrix.multiply([cannonical, vertex]);
        }
      }
      //clipping
      let c_index = 0;
      let clipped_vertices = [];
      for (let i = 0; i < shapeEdges.length; i++) {
        //first point
        let pt0 = cannonical_vertices[shapeEdges[i][0]];
        for (let j = 1; j < shapeEdges[i].length; j++) {
          //second point
          let pt1 = cannonical_vertices[shapeEdges[i][j]];
          //edge to be clipped
          let edge = {
            pt0: { x: pt0.data[0], y: pt0.data[1], z: pt0.data[2] },
            pt1: { x: pt1.data[0], y: pt1.data[1], z: pt1.data[2] },
          };
          let clipped_line = this.clipLinePerspective(edge, -(this.scene.view.clip[4] / this.scene.view.clip[5]));
          //if line is within view, convert to matrix
          if (clipped_line) {
            let v1 = Vector4(clipped_line.pt0.x, clipped_line.pt0.y, clipped_line.pt0.z, 1);
            let v2 = Vector4(clipped_line.pt1.x, clipped_line.pt1.y, clipped_line.pt1.z, 1);
            clipped_vertices[c_index++] = v1;
            clipped_vertices[c_index++] = v2;
          }
          //next point
          pt0 = pt1;
        }
      }

      //multiply by m_per
      let final_vertices = [];
      for (let i = 0; i < clipped_vertices.length; i++) {
        let calc = Matrix.multiply([mat4x4MPer(), clipped_vertices[i]]);

        //divide by w
        let vertex = Vector4(
          [calc.values[0][0] / calc.values[3][0]],
          [calc.values[1][0] / calc.values[3][0]],
          [calc.values[2][0] / 1],
          [1]
        );
        final_vertices[i] = vertex;
      }

      //convert to viewport and draw
      for (let i = 0; i < final_vertices.length; i += 2) {
        let converted_vertex1 = Matrix.multiply([mat4x4Viewport(view.width, view.height), final_vertices[i]]);
        let converted_vertex2 = Matrix.multiply([mat4x4Viewport(view.width, view.height), final_vertices[i + 1]]);
        this.drawLine(
          converted_vertex1.values[0],
          converted_vertex1.values[1],
          converted_vertex2.values[0],
          converted_vertex2.values[1]
        );
      }
    }
  }

  // Get outcode for a vertex
  // vertex:       Vector4 (transformed vertex in homogeneous coordinates)
  // z_min:        float (near clipping plane in canonical view volume)
  outcodePerspective(vertex, z_min) {
    let outcode = 0;
    if (vertex.x < vertex.z - FLOAT_EPSILON) {
      outcode += LEFT;
    } else if (vertex.x > -vertex.z + FLOAT_EPSILON) {
      outcode += RIGHT;
    }
    if (vertex.y < vertex.z - FLOAT_EPSILON) {
      outcode += BOTTOM;
    } else if (vertex.y > -vertex.z + FLOAT_EPSILON) {
      outcode += TOP;
    }
    if (vertex.z < -1.0 - FLOAT_EPSILON) {
      outcode += FAR;
    } else if (vertex.z > z_min + FLOAT_EPSILON) {
      outcode += NEAR;
    }
    return outcode;
  }

  // Clip line - should either return a new line (with two endpoints inside view volume)
  //             or null (if line is completely outside view volume)
  // line:         object {pt0: Vector4, pt1: Vector4}
  // z_min:        float (near clipping plane in canonical view volume)
  clipLinePerspective(line, z_min) {
    let result = null;
    let p0 = Vector3(line.pt0.x, line.pt0.y, line.pt0.z);
    let p1 = Vector3(line.pt1.x, line.pt1.y, line.pt1.z);
    let out0 = this.outcodePerspective(p0, z_min);
    let out1 = this.outcodePerspective(p1, z_min);

    // TODO: implement clipping here!

    //while we cant trivial accept/reject
    while (!result) {
      if (out0 === 0 && out1 === 0) {
        //trivial accept
        result = { pt0: p0, pt1: p1 };
        break;
      } else if (out0 & (out1 !== 0)) {
        //trivial reject
        break;
      } else {
        let curOutCode;
        if (out0 === 0) {
          //pt0 is inside frustum
          curOutCode = out1;
        } else if (out1 === 0) {
          //pt1 is inside frustum
          curOutCode = out0;
        } else {
          //both outside, begin with first code
          curOutCode = out0;
        }

        //deltas
        let dx = p1.x - p0.x;
        let dy = p1.y - p0.y;
        let dz = p1.z - p0.z;
        let t;

        //clip against first edge
        if ((curOutCode & LEFT) == LEFT) {
          //clip against left edge
          t = (-p0.x + p0.z) / (dx - dz);
        } else if ((curOutCode & RIGHT) == RIGHT) {
          //clip against right edge
          t = (p0.x + p0.z) / (-dx - dz);
        } else if ((curOutCode & BOTTOM) == BOTTOM) {
          //clip against bottom edge
          t = (-p0.y + p0.z) / (dy - dz);
        } else if ((curOutCode & TOP) == TOP) {
          //clip against top edge
          t = (p0.y + p0.z) / (-dy - dz);
        } else if ((curOutCode & NEAR) == NEAR) {
          //clip against near edge
          t = (p0.z - z_min) / -dz;
        } else if ((curOutCode & FAR) == FAR) {
          //clip against far edge
          t = (-p0.z - 1) / dz;
        }
        let x = p0.x + t * dx;
        let y = p0.y + t * dy;
        let z = p0.z + t * dz;
        //update point
        if (curOutCode === out0) {
          //update p0 and out0
          p0 = Vector3(x, y, z);
          out0 = this.outcodePerspective(p0, z_min);
        } else {
          //update p1 and out1
          p1 = Vector3(x, y, z);
          out1 = this.outcodePerspective(p1, z_min);
        }
      }
    }
    return result;
  }

  //
  animate(timestamp) {
    // Get time and delta time for animation
    if (this.start_time === null) {
      this.start_time = timestamp;
      this.prev_time = timestamp;
    }
    let time = timestamp - this.start_time;
    let delta_time = timestamp - this.prev_time;

    // Update transforms for animation
    this.updateTransforms(time, delta_time);

    // Draw slide
    this.draw();

    // Invoke call for next frame in animation
    if (this.enable_animation) {
      window.requestAnimationFrame((ts) => {
        this.animate(ts);
      });
    }

    // Update previous time to current one for next calculation of delta time
    this.prev_time = timestamp;
  }

  //
  updateScene(scene) {
    this.scene = this.processScene(scene);
    if (!this.enable_animation) {
      this.draw();
    }
  }

  //
  processScene(scene) {
    let processed = {
      view: {
        prp: Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]),
        srp: Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]),
        vup: Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]),
        clip: [...scene.view.clip],
      },
      models: [],
    };

    for (let i = 0; i < scene.models.length; i++) {
      let model = { type: scene.models[i].type };
      if (model.type === 'generic') {
        model.vertices = [];
        model.edges = JSON.parse(JSON.stringify(scene.models[i].edges));
        for (let j = 0; j < scene.models[i].vertices.length; j++) {
          model.vertices.push(
            Vector4(scene.models[i].vertices[j][0], scene.models[i].vertices[j][1], scene.models[i].vertices[j][2], 1)
          );
          if (scene.models[i].hasOwnProperty('animation')) {
            model.animation = JSON.parse(JSON.stringify(scene.models[i].animation));
          }
        }
      } else {
        model.center = Vector4(scene.models[i].center[0], scene.models[i].center[1], scene.models[i].center[2], 1);
        for (let key in scene.models[i]) {
          if (scene.models[i].hasOwnProperty(key) && key !== 'type' && key != 'center') {
            model[key] = JSON.parse(JSON.stringify(scene.models[i][key]));
          }
        }
      }

      model.matrix = new Matrix(4, 4);
      processed.models.push(model);
    }

    return processed;
  }

  // x0:           float (x coordinate of p0)
  // y0:           float (y coordinate of p0)
  // x1:           float (x coordinate of p1)
  // y1:           float (y coordinate of p1)
  drawLine(x0, y0, x1, y1) {
    //console.log('x0: ' + x0 + ', y0: ' + y0 + ', x1: ' + x1 + ', y1: ' + y1);
    this.ctx.strokeStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.moveTo(x0, y0);
    this.ctx.lineTo(x1, y1);
    this.ctx.stroke();

    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(x0 - 2, y0 - 2, 4, 4);
    this.ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
  }

  // Generate vertices and edges for cube
  generateCube(center, width, height, depth) {
    console.log('Cube');
    // Calculate the coordinates of the eight vertices of the cube
    let halfWidth = width / 2;
    let halfHeight = height / 2;
    let halfDepth = depth / 2;
    let centerX = center.values[0];
    let centerY = center.values[1];
    let centerZ = center.values[2];

    // Calculate vertices
    let vertex1 = [centerX - halfWidth, centerY + halfHeight, centerZ - halfDepth];
    let vertex2 = [centerX + halfWidth, centerY + halfHeight, centerZ - halfDepth];
    let vertex3 = [centerX + halfWidth, centerY - halfHeight, centerZ - halfDepth];
    let vertex4 = [centerX - halfWidth, centerY - halfHeight, centerZ - halfDepth];
    let vertex5 = [centerX - halfWidth, centerY + halfHeight, centerZ + halfDepth];
    let vertex6 = [centerX + halfWidth, centerY + halfHeight, centerZ + halfDepth];
    let vertex7 = [centerX + halfWidth, centerY - halfHeight, centerZ + halfDepth];
    let vertex8 = [centerX - halfWidth, centerY - halfHeight, centerZ + halfDepth];

    // Define the edges of the cube by specifying the indices of the vertices
    let edges = [
      [0, 1, 2, 3, 0], // bottom face
      [4, 5, 6, 7, 4], // top face
      [0, 4], // connecting edges
      [1, 5],
      [2, 6],
      [3, 7],
    ];

    return {
      vertices: [vertex1, vertex2, vertex3, vertex4, vertex5, vertex6, vertex7, vertex8],
      edges,
    };
  }

  // Generate vertices and edges for cone
  generateCone(center, radius, height, sides) {}

  // Generate vertices and edges for cylinder
  generateCylinder(center, radius, height, sides) {
    console.log('Cylinder');
    let vertices = [];
    let edges = [];

    // Create the vertices
    for (let i = 0; i < sides; i++) {
      let angle = (2 * Math.PI * i) / sides;
      let x = center[0] + radius * Math.cos(angle);
      let y = center[1] + height / 2;
      let z = center[2] + radius * Math.sin(angle);
      vertices.push([x, y, z]);

      y = center[1] - height / 2;
      vertices.push([x, y, z]);
    }

    // Create the edges
    for (let i = 0; i < sides; i++) {
      let a = i * 2;
      let b = (i * 2 + 2) % (sides * 2);
      edges.push([a, b]);
      edges.push([a + 1, b + 1]);
      edges.push([a, a + 1]);
    }

    return { vertices: vertices, edges: edges };
  }
  // Generate vertices and edges for sphere
  generateSphere(center, radius, slices, stacks) {}
  // Find center for generic
  findCenter(vertices) {
    // console.log(vertices);
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    for (let i = 0; i < vertices.length; i++) {
      sumX += vertices[i].x;
      sumY += vertices[i].y;
      sumZ += vertices[i].z;
    }

    return { x: sumX / vertices.length, y: sumY / vertices.length, z: sumZ / vertices.length };
  }
}
