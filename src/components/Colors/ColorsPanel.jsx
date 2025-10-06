import ColorsList from "./ColorsList";
import classes from "./ColorsPanel.module.css";
import { useContext } from "react";
import ColorsContext from "../../context/colors-context";
import ProjectInfoWindow from "./ProjectInfoWindow";
import {
  Box, FormControlLabel,
  Checkbox, useTheme
} from "@mui/material";
import BeadFilter from "./BeadFilter";
import { useQuery } from "@tanstack/react-query";

const ColorsPanel = () => {
  const { colorPalette, selectedBrands, beadSize, setScrapedColors, setSelectedBrands, showOriginalColors, setShowOriginalColors } = useContext(ColorsContext);
  const colorsNotEmpty = Object.values(colorPalette).length > 0;

  const theme = useTheme();

  function fetchScrapedColors(selectedBrands, beadSize) {
    console.log("Selected Brands: ", selectedBrands);
    console.log("Selected Size: ", beadSize);
    return fetch("https://rgb-color-matcher-and-web-scraper.onrender.com/api/get-color-table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedBrands, beadSize }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(`Scraped Colors (${Object.keys(data).length}):`, data);
        setScrapedColors(data);
        return data;
      })
      .catch((error) => console.error("Error fetching colors: ", error));
  }

  const { isLoading, error } = useQuery({
    queryKey: [
      "scraped-colors",
      selectedBrands.perler,
      selectedBrands.artkal,
      selectedBrands.top_tier,
      beadSize,
    ],
    queryFn: () => fetchScrapedColors(selectedBrands, beadSize),
  });

  let colorsList = <p>No image selected</p>;
  if (colorsNotEmpty) {
    colorsList = <ColorsList />;
  }
  if (isLoading) {
    colorsList = <p>Grabbing bead colors...</p>;
  }
  if (error) {
    colorsList = <p>Something went wrong! {error}</p>;
  }

  return (
    <Box
      className={classes.panel}
      sx={{ borderLeft: "1px solid", borderColor: "divider" }}
    >
      <ProjectInfoWindow />
      <BeadFilter />
      {colorsList}
      <Box>
        <FormControlLabel
          sx={{
            "& .MuiTypography-root": {
              fontSize: theme.typography.small,
            },
          }}
          control={
            <Checkbox
              sx={{ "& .MuiSvgIcon-root": { fontSize: 18 } }}
              checked={showOriginalColors}
              onChange={() => setShowOriginalColors((prev) => !prev)}
              inputProps={{ "aria-label": "controlled" }}
            />
          }
          label="Original Colors"
        />
      </Box>
    </Box>
  );
};

export default ColorsPanel;
