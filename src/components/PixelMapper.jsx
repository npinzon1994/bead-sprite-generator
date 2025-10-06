import {
  useContext,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import classes from "./PixelMapper.module.css";
import ColorsContext from "../context/colors-context";
import { generateGrid } from "../util/grid";
import ControlsContext from "../context/controls-context";

function PixelMapper() {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fileRef = useRef(null);
  const mainRef = useRef(null);

  const {
    setColorPalette,
    colorPalette,
    imagePixelData,
    setImagePixelData,
    uploadedImage,
    highlightedColor,
    showOriginalColors,
    setShowOriginalColors
  } = useContext(ColorsContext);

  const { backgroundSettings, gridSettings, boardSize, zoomLevel } =
    useContext(ControlsContext);

  const [grid, setGrid] = useState([]);

  const [isHovering, setIsHovering] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  function handleMouseDown() {
    if (spacePressed) {
      setIsGrabbing(true);
    }
  }

  function handleMouseMove(event) {
    if (isGrabbing) {
      const mainContainer = mainRef.current;
      if (!mainContainer) {
        return;
      }
      const scrollSpeed = 1;
      mainContainer.scrollLeft -= event.movementX * scrollSpeed;
      mainContainer.scrollTop -= event.movementY * scrollSpeed;
    }
  }

  function handleMouseUp() {
    setIsGrabbing(false);
  }

  //listening for spacebar press
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === " " && event.target === document.body) {
        event.preventDefault();
      }
      if (isHovering && event.key === " " && !spacePressed) {
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (event) => {
      if (isHovering && event.key === " ") {
        setSpacePressed(false);
        setIsGrabbing(false);
      }
    };

    if (isHovering) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [spacePressed, isHovering]);

  //1st effect -- FILE UPLOAD
  useEffect(() => {
    if (!uploadedImage || fileRef.current === uploadedImage) {
      return;
    }
    console.log("New File: ", uploadedImage);
    fileRef.current = uploadedImage;
    console.log("Clearing color palette...");
    setColorPalette({});

    const formData = new FormData();
    formData.append("image", uploadedImage);

    fetch("https://rgb-color-matcher-and-web-scraper.onrender.com/api/upload-image", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Setting image pixel data...");
        setImagePixelData(data);
        // setLookupTableValues(data.lookupTable_LabValues);
      })
      .catch(console.error);
  }, [uploadedImage, setColorPalette, setImagePixelData]);

  //2nd effect -- IMAGE PROCESSING
  useEffect(() => {
    if (!imagePixelData.updatedPixels) {
      return;
    }
    console.log("Image pixel data changed!");
    const colors = {};
    const { updatedPixels } = imagePixelData;

    for (let i = 0; i < updatedPixels.length; i += 4) {
      const r = updatedPixels[i];
      const g = updatedPixels[i + 1];
      const b = updatedPixels[i + 2];
      const a = updatedPixels[i + 3];
      if (a === 0 || a === 255) {
        const colorKey = `R${r}G${g}B${b}A${a}`;
        if (!colors[colorKey]) {
          console.log("NEW COLOR! -- ", colorKey);
          colors[colorKey] = { colorKey, r, g, b, a, quantity: 1 };
        } else {
          colors[colorKey].quantity++;
        }
      }
    }
    console.log("Setting color palette...");
    setColorPalette(colors);
  }, [imagePixelData, setColorPalette]);

  //3rd effect -- DRAW IMAGE TO CANVAS
  useEffect(() => {
    console.log("Effect 3 running...");
    // console.log("Color Palette: ", colorPalette);

    if (!colorPalette || Object.keys(colorPalette).length === 0) {
      return;
    }

    // if (!imagePixelData.updatedPixels) {
    //   return;
    // }

    const { width, height, updatedPixels, originalPixels } = imagePixelData;

    const gridLines = generateGrid(
      width,
      height,
      boardSize,
      gridSettings.color
    );

    const grid_svg = (
      <svg viewBox={`0 0 ${width} ${height}`} className={classes["grid-svg"]}>
        {gridLines.vertLines}
        {gridLines.horizLines}
      </svg>
    );
    setGrid(grid_svg);

    //SET UP CANVAS
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    //Account for Zoom Level
    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, canvas.width, canvas.height); //clearing prev img
    // context.setTransform(1, 0, 0, 1, 0, 0); //reset transformation

    // context.scale(zoomLevel, zoomLevel);

    //gather data and draw image
    const pixelData = new Uint8ClampedArray(width * height * 4);

    //see if OG colors box was checked
    const outputPixels = showOriginalColors ? originalPixels : updatedPixels;
    for (let i = 0; i < outputPixels.length; i += 4) {
      const r = outputPixels[i];
      const g = outputPixels[i + 1];
      const b = outputPixels[i + 2];
      const a = outputPixels[i + 3];

      pixelData[i] = r;
      pixelData[i + 1] = g;
      pixelData[i + 2] = b;
      pixelData[i + 3] = a;

      if (!highlightedColor) {
        continue;
      }

      if (
        r !== highlightedColor.r ||
        g !== highlightedColor.g ||
        b !== highlightedColor.b
      ) {
        pixelData[i + 3] = 0;
      }
    }

    // console.log("PIXEL DATA: ", pixelData);

    const imageData = new ImageData(pixelData, width, height);
    context.putImageData(imageData, 0, 0);

    // Export the canvas as a Blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Failed to create blob from canvas");
          return;
        }
        const url = URL.createObjectURL(blob);
        // console.log("URL: ", url);

        // Clean up the Blob URL after it's used
        return () => URL.revokeObjectURL(url);
      },
      "image/png",
      1.0 // Quality parameter for PNG
    );
  }, [
    colorPalette,
    imagePixelData,
    zoomLevel,
    gridSettings,
    boardSize,
    highlightedColor,
    showOriginalColors
  ]);

  //adjusting size of main so scrollbars appear on overflow
  useLayoutEffect(() => {
    const mainContainer = mainRef.current;
    const canvasContainer = canvasContainerRef.current;
    if (mainContainer && canvasContainer) {
      const { width } = canvasContainer.getBoundingClientRect();
      mainContainer.style.width = `${width}px`;
    }
  }, [zoomLevel]);

  return (
    <main
      id={classes.main}
      ref={mainRef}
      className={`${spacePressed ? classes["space-pressed"] : ""} ${isGrabbing ? classes["is-grabbing"] : ""
        }`}
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={
        backgroundSettings.isVisible
          ? {
            background: backgroundSettings.color,
          }
          : undefined
      }
    >
      <div
        className={classes["canvas-container"]}
        ref={canvasContainerRef}
        style={{
          transformOrigin: "top left",
          transform: `scale(${zoomLevel})`,
        }}
      >
        <canvas ref={canvasRef} className={classes.canvas} />
        {gridSettings.isVisible ? grid : undefined}
      </div>
    </main>
  );
}

export default PixelMapper;
