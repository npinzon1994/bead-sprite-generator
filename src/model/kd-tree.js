class KDTree {
    //points -- coordinate points -- each point is a pixel
    //depth -- current level in the tree
    //k -- number of dimensions
    constructor(points = [], level = 0) {
      this.axis = level % 3; //R=0, G=1, B=2
  
      //base case -- exit algorithm when there are no more points to process
      if (points.length === 0) {
        this.point = null; //current point
        this.left = null; //left side of current point
        this.right = null; //right side of current point
        return;
      }
  
      if (points.length === 1) {
        this.point = points[0];
        this.axis = level % 3;
        this.left = null; // ✅ Prevents unnecessary empty tree creation
        this.right = null;
        return;
      }
  
      //tree needs pre-sorted array
      points.sort((a, b) => a[this.axis] - b[this.axis]); //sort points per axis
      const midpoint = Math.floor(points.length / 2);
  
      //currently, points[] is a matrix sorted by the current axis | this.axis starts at 0 (X-axis)
      this.point = points[midpoint];
      this.left = new KDTree(points.slice(0, midpoint), level + 1); //grabbing all elements for left child node
      this.right = new KDTree(points.slice(midpoint + 1), level + 1); //grabbing all elements for right child node
    }
  
    calculateDistance(point1, point2) {
      const deltaX = (point1[0] - point2[0]) ** 2;
      const deltaY = (point1[1] - point2[1]) ** 2;
      const deltaZ = (point1[2] - point2[2]) ** 2;
      return Math.sqrt(deltaX + deltaY + deltaZ);
    }

    toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }


  calculateDeltaE(point1, point2, kL = 1, kC = 1, kH = 1) {
    //------------------------calculate C' and H' for both points-----------------------------
    const cStar1 = Math.sqrt((point1[1]) ** 2 + (point1[2]) ** 2);
    const cStar2 = Math.sqrt((point2[1]) ** 2 + (point2[2]) ** 2);
    const cStarDash = (cStar1 + cStar2) / 2;
    const G = 0.5 * (1 - Math.sqrt((cStarDash) ** 7 / ((cStarDash) ** 7 + 25 ** 7)));
    const aPrime1 = (1 + G) * point1[1];
    const aPrime2 = (1 + G) * point2[1];

    const cPrime1 = Math.sqrt((aPrime1) ** 2 + (point1[2]) ** 2);
    const cPrime2 = Math.sqrt((aPrime2) ** 2 + (point2[2]) ** 2);

    let hPrime1;
    if (point1[2] === 0 && aPrime1 === 0) {
      hPrime1 = 0;
    } else {
      hPrime1 = this.toDegrees(Math.atan2(point1[2], aPrime1));
      if (hPrime1 < 0) {
        hPrime1 += 360;
      }
    }

    let hPrime2;
    if (point2[2] === 0 && aPrime2 === 0) {
      hPrime2 = 0;
    } else {
      hPrime2 = this.toDegrees(Math.atan2(point2[2], aPrime2));
      if (hPrime2 < 0) {
        hPrime2 += 360;
      }
    }

    //------------------------calculate deltaL, deltaC, and deltaH---------------------------
    const deltaL = point2[0] - point1[0];
    const deltaC = cPrime2 - cPrime1;
    const hueVariance = hPrime2 - hPrime1;
    const saturationAtOrigin = cPrime1 * cPrime2 === 0;
    let delta_h;
    if (saturationAtOrigin) {
      delta_h = 0;
    } else if (!saturationAtOrigin && Math.abs(hueVariance) <= 180) {
      delta_h = hueVariance;
    } else if (!saturationAtOrigin && hueVariance > 180) {
      delta_h = (hueVariance) - 360;
    } else if (!saturationAtOrigin && hueVariance < -180) {
      delta_h = (hueVariance) + 360;
    }
    const deltaH = 2 * (Math.sqrt(cPrime1 * cPrime2)) * Math.sin(this.toRadians(delta_h) / 2);


    //-------------------------Calculate CIEDE2000 Color-Difference--------------------------
    const L_dash = (point1[0] + point2[0]) / 2;
    const C_dash = (cPrime1 + cPrime2) / 2;
    let h_dash;
    if ((Math.abs(hPrime1 - hPrime2) <= 180) && !saturationAtOrigin) {
      h_dash = (hPrime1 + hPrime2) / 2;
    } else if ((Math.abs(hPrime1 - hPrime2) > 180) && (Math.abs(hPrime1 + hPrime2) < 360) && !saturationAtOrigin) {
      h_dash = (hPrime1 + hPrime2 + 360) / 2;
    } else if ((Math.abs(hPrime1 - hPrime2) > 180) && (Math.abs(hPrime1 + hPrime2) >= 360) && !saturationAtOrigin) {
      h_dash = (hPrime1 + hPrime2 - 360) / 2;
    } else if (saturationAtOrigin) {
      h_dash = hPrime1 + hPrime2;
    }

    const T = 1 - 0.17 * Math.cos(this.toRadians(h_dash - 30)) + 0.24 * Math.cos(this.toRadians(2 * h_dash))
      + 0.32 * Math.cos(this.toRadians(3 * h_dash + 6)) - 0.20 * Math.cos(this.toRadians(4 * h_dash - 63));

    const expFunctionOperand = (((h_dash - 275) / 25) ** 2) * -1
    const deltaTheta = 30 * Math.exp(expFunctionOperand);

    const rC = 2 * Math.sqrt((C_dash ** 7) / ((C_dash ** 7) + (25 ** 7)));
    const sL = 1 + ((0.015 * (L_dash - 50) ** 2) / (Math.sqrt(20 + (L_dash - 50) ** 2)));
    const sC = 1 + (0.045 * C_dash);
    const sH = 1 + (0.015 * C_dash * T);
    const rT = (Math.sin(this.toRadians(2 * deltaTheta)) * -1) * rC;

    const deltaE = Math.sqrt((deltaL / (kL * sL)) ** 2 + (deltaC / (kC * sC)) ** 2 + (deltaH / (kH * sH)) ** 2 + rT * (deltaC / (kC * sC)) * (deltaH / (kH * sH)));
    const results = {
      h_dash,
      aPrime1,
      aPrime2,
      cPrime1,
      cPrime2,
      hPrime1,
      hPrime2,
      G,
      T,
      sL,
      sC,
      sH,
      rT,
      deltaE,
      delta_h,
      deltaH,
      deltaL,
      deltaC
    }
    return results;

  }
  
    findNearestNeighbor(
      targetPoint,
      level = 0,
      bestMatch = { point: null, distance: Infinity }
    ) {
      if (!this.point) {
        // console.log("FINAL Best Match: ", bestMatch.point)
        return bestMatch;
      }
      const axis = level % 3;
      const distance = this.calculateDistance(targetPoint, this.point);
  
      //update best match if current point is closer
      if (distance < bestMatch.distance) {
        // console.log("NEW Best Match: ", bestMatch.point)
        bestMatch = { point: this.point, distance };
      }
  
      const direction = targetPoint[axis] < this.point[axis] ? "left" : "right"; //need to figure out which side to traverse
      const otherDirection = direction === "left" ? "right" : "left";
  
      //checking which direction and then updating point and re-calling function
      if (this[direction]) {
        bestMatch = this[direction].findNearestNeighbor(
          targetPoint,
          level + 1,
          bestMatch
        );
      }
  
      //EDGE CASE -- check other side if it contains a closer point
      if (
        this[otherDirection] && //checks if other branch exists
        Math.abs(targetPoint[axis] - this.point[axis]) < bestMatch.distance //checks if point in other branch is closer and if so, updates the bestMatch
      ) {
        bestMatch = this[otherDirection].findNearestNeighbor(
          targetPoint,
          level + 1,
          bestMatch
        );
      }
  
      return bestMatch;
    }
  }
  
  export default KDTree;
  