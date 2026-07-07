import { useContext, useEffect, useState } from "react";
import classes from "./App.module.css";
import ColorsContext from "./context/colors-context";
import PixelMapper from "./components/PixelMapper";
import Controls from "./components/Controls/Controls";
import ColorsPanel from "./components/Colors/ColorsPanel";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  GlobalStyles,
} from "@mui/material";
import { processImage } from "./model/matrix-transformations";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

function App() {
  const queryClient = new QueryClient();
  const [darkMode, setDarkMode] = useState(true);

  const {
    imagePixelData,
    setImagePixelData,
    scrapedColors,
    selectedBrands,
    beadSize
  } = useContext(ColorsContext);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      toggleDarkMode: setDarkMode,
      darkModeState: darkMode,
      primary: {
        light: "#B1C2FF",
        semiLight: "#7292ff",
        main: "#3b68ff", //main shade of primary color
        dark: "#132254",
        translucent: "rgba(59, 104, 255, 0.7)",
      },
      background: {
        default: darkMode ? "#1a1a1a" : "#e0e0e0", //primary bg color
        paper: darkMode ? "#242424" : "#ffffff", //secondary bg color
      },
      text: {
        primary: darkMode ? "#ffffff" : "#000000",
        bigNumber: darkMode ? "#7292ff" : "#3b68ff",
        heading: darkMode ? "#CCD7FF" : "#132254",
        smallText: darkMode ? "#C6CADC" : "#6D7388",
      },
    },
    typography: {
      fontFamily: "Nunito Sans, serif",
      large: {
        fontSize: "1.7rem",
      },
      medium: {
        fontSize: "0.85rem",
      },
      small: {
        fontSize: "0.75rem",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            backgroundColor: "#3b68ff",
          },
        },
      },
    },
  });

  //fetching default image on first load
  useEffect(() => {
    fetch("http://localhost:5000/api/default-image")
      .then((response) => {
        console.log("[React] Response Received (Default Image Pixel Data)");
        return response.json();
      })
      .then((data) => {
        console.log("[React] Default Image Pixel Data:", data);
        setImagePixelData(data);
      })
      .catch((error) => console.error("Error fetching default image:", error));
  }, [setImagePixelData]);

  // useQuery({
  //   queryKey: [
  //     "reprocess-image",
  //     selectedBrands.perler,
  //     selectedBrands.artkal,
  //     selectedBrands.top_tier,
  //     beadSize,
  //   ], queryFn: () => {
  //     if (!imagePixelData.originalPixels) {
  //       return;
  //     }
  //     const { updatedPixels } = processImage(
  //       imagePixelData.originalPixels,
  //       scrapedColors
  //     );
  //     setImagePixelData((prev) => ({ ...prev, updatedPixels }));
  //   }
  // });

  // reprocessing colors when bead selection changes
  useEffect(() => {
    if (!imagePixelData.originalPixels) {
      return;
    }
    const { updatedPixels } = processImage(
      imagePixelData.originalPixels,
      scrapedColors
    );
    setImagePixelData((prev) => ({ ...prev, updatedPixels }));
  }, [scrapedColors]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Resets default browser styles */}
        <GlobalStyles
          styles={(theme) => ({
            body: {
              backgroundColor: theme.palette.background.default,
              margin: 0,
              padding: 0,
              fontFamily: theme.typography.fontFamily,
            },
            main: {
              backgroundColor: theme.palette.background.paper,
            },
            "::-webkit-scrollbar": {
              width: "8px", // width of the scrollbar
              height: "8px", // height of horizontal scrollbar
            },
            "::-webkit-scrollbar-track": {
              backgroundColor: darkMode ? "#333" : "#e0e0e0", // color of scrollbar track
            },
            "::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.primary.main, // color of the scrollbar thumb
            },
            "::-webkit-scrollbar-thumb:hover": {
              backgroundColor: theme.palette.primary.dark, // thumb color on hover
            },
            "::-webkit-scrollbar-button": {
              display: "none", // optional: hide scroll buttons (arrows)
            },
          })}
        />
        <div id={classes["main-wrapper"]}>
          <Controls />
          <PixelMapper />
          <ColorsPanel />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
