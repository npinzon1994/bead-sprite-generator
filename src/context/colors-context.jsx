import { createContext, useState, useCallback, useMemo } from "react";

const ColorsContext = createContext({
  colorPalette: {},
  setColorPalette: () => { },
  imagePixelData: {},
  setImagePixelData: () => { },
  lookupTableValues: [],
  setLookupTableValues: () => { },
  uploadedImage: null,
  setUploadedImage: () => { },
  scrapedColors: {},
  setScrapedColors: () => { },
  highlightedColor: {},
  setHighlightedColor: () => { },
  selectedBrands: {},
  setSelectedBrands: () => { },
  beadSize: "",
  setBeadSize: () => { },
  showOriginalColors: false,
  setShowOriginalColors: () => { }
});

export const ColorsContextProvider = ({ children }) => {
  const [colorPalette, updateColorPalette] = useState({});
  const [imagePixelData, updateImagePixelData] = useState({});
  const [lookupTableValues, updateLookupTableValues] = useState([]);
  const [uploadedImage, updateUploadedImage] = useState(null);
  const [scrapedColors, updateScrapedColors] = useState({});
  const [highlightedColor, setHighlightedColor] = useState(null);
  const [showOriginalColors, updateShowOriginalColors] = useState(false);
  const [selectedBrands, updateSelectedBrands] = useState({
    perler: true,
    artkal: false,
    top_tier: false,
  });
  const [beadSize, updateBeadSize] = useState("midi");

  const setColorPalette = useCallback(
    (colors) => updateColorPalette(colors),
    []
  );

  const setImagePixelData = useCallback(
    (data) => updateImagePixelData(data),
    []
  );

  const setLookupTableValues = useCallback(
    (values) => updateLookupTableValues(values),
    []
  );

  const setUploadedImage = useCallback((file) => updateUploadedImage(file), []);

  const setScrapedColors = useCallback(
    (colors) => updateScrapedColors(colors),
    []
  );

  const setShowOriginalColors = useCallback(
    (colors) => updateShowOriginalColors(colors),
    []
  );

  const setSelectedBrands = useCallback(
    (brands) => updateSelectedBrands(brands),
    []
  );

  const setBeadSize = useCallback((size) => updateBeadSize(size), []);

  /**
   * useMemo ensures different states can be independently
   * updated without causing unnecessary re-renders to all
   * consuming components
   */
  const contextValue = useMemo(
    () => ({
      colorPalette,
      setColorPalette,
      imagePixelData,
      setImagePixelData,
      lookupTableValues,
      setLookupTableValues,
      uploadedImage,
      setUploadedImage,
      scrapedColors,
      setScrapedColors,
      highlightedColor,
      setHighlightedColor,
      selectedBrands,
      setSelectedBrands,
      beadSize,
      setBeadSize,
      showOriginalColors,
      setShowOriginalColors
    }),
    [
      colorPalette,
      setColorPalette,
      imagePixelData,
      setImagePixelData,
      lookupTableValues,
      setLookupTableValues,
      uploadedImage,
      setUploadedImage,
      scrapedColors,
      setScrapedColors,
      highlightedColor,
      setHighlightedColor,
      selectedBrands,
      setSelectedBrands,
      beadSize,
      setBeadSize,
      showOriginalColors,
      setShowOriginalColors
    ]
  );

  return (
    <ColorsContext.Provider value={contextValue}>
      {children}
    </ColorsContext.Provider>
  );
};

export default ColorsContext;
