import ColorsContext from "../../context/colors-context";
import { useContext, useState } from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListSubheader,
  Typography,
  useTheme,
  Box,
  Button,
  IconButton,
  Tooltip
} from "@mui/material";

import PalettePickerPopover from "../Controls/PalettePickerPopover";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

const formatWithComma = (number) => Intl.NumberFormat("en-US").format(number);

const ColorsList = () => {
  const { colorPalette, scrapedColors, setHighlightedColor, highlightedColor } =
    useContext(ColorsContext);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [mouseDown, setMouseDown] = useState(false);
  const theme = useTheme();

  const colorPaletteArray = Object.values(colorPalette);
  const outputColors = [];

  const [swapSourceColor, setSwapSourceColor] = useState(null);
  const [swapAnchorEl, setSwapAnchorEl] = useState(null);

  function handleManualSwap(replacementColor) {
    const sourceKey = `R${swapSourceColor.r}G${swapSourceColor.g}B${swapSourceColor.b}A${swapSourceColor.a}`;

    setColorSwapMap((prev) => ({
      ...prev,
      [sourceKey]: {
        ...replacementColor,
        a: swapSourceColor.a,
      },
    }));

    setSwapSourceColor(null);
    setSwapAnchorEl(null);
  }

  for (let i = 0; i < colorPaletteArray.length; i++) {
    const color = { ...colorPaletteArray[i] };
    const { r, g, b } = color;
    const colorKey = `R${r}G${g}B${b}`;
    const name =
      colorKey in scrapedColors ? scrapedColors[colorKey].name : colorKey;
    color.colorKey = colorKey;
    color.name = name;
    outputColors.push(color);
  }

  const filteredColors = outputColors.filter((color) => color.a !== 0);
  const handleListItemClick = (index) => {
    setSelectedIndex((prev) => (index === prev ? null : index));
  };

  const getContrastingTextColor = (r, g, b) => {
    // Calculate luminance using relative luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff"; // Use black text if background is light
  };

  function swapColor(sourceColor, replacementColor) {
    const sourceKey = `R${sourceColor.r}G${sourceColor.g}B${sourceColor.b}A${sourceColor.a}`;

    setColorSwapMap((prev) => ({
      ...prev,
      [sourceKey]: {
        ...replacementColor,
        a: sourceColor.a,
      },
    }));
  }

  return (
    <List sx={{ overflow: "auto", padding: 0, maxHeight: "100vh" }}>
      <ListSubheader
        sx={{
          fontSize: theme.typography.small,
          color: theme.palette.text.heading,
          lineHeight: 2,
          paddingBlock: 0.25,
        }}
      >
        COLORS
      </ListSubheader>
      <PalettePickerPopover
        open={Boolean(swapAnchorEl)}
        anchorEl={swapAnchorEl}
        onClose={() => {
          setSwapAnchorEl(null);
          setSwapSourceColor(null);
        }}
        scrapedColors={scrapedColors}
        sourceColor={swapSourceColor}
        onSelectColor={handleManualSwap}
      />
      {filteredColors.map((color, index) => (
        <ListItem key={index} disablePadding>
          <ListItemButton
            selected={selectedIndex === index}
            onClick={() => {
              handleListItemClick(index);
              setHighlightedColor((prev) => {
                if (!prev) return color;
                return prev.colorKey === color.colorKey ? null : color;
              });
            }}
            sx={{
              background: `rgba(${color.r}, ${color.g}, ${color.b}, 0.85)`,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              alignItems: "center",
              justifyContent: "space-evenly",
              gap: 1.5,
              paddingBlock: 1.2,
              paddingInline: 1,
              opacity: selectedIndex !== null && selectedIndex !== index ? 0.35 : 1,

              "&:hover": {
                background: `rgba(${color.r}, ${color.g}, ${color.b}, 0.65)`,
              },
              "&.Mui-selected": {
                background: `rgba(${color.r}, ${color.g}, ${color.b}, 1)`,
                "&:hover": {
                  background: `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`,
                },
              },
            }}
          >
            {/* Quantity - left */}
            <Typography
              sx={{
                color: getContrastingTextColor(color.r, color.g, color.b),
                fontSize: "0.65rem",
                fontWeight: 700,
                opacity: 0.85,
              }}
            >
              {formatWithComma(color.quantity)}
            </Typography>

            {/* Color name - center */}
            <Typography
              sx={{
                color: getContrastingTextColor(color.r, color.g, color.b),
                fontSize: "0.9rem",
                fontWeight: 800,
                textAlign: "center",
                justifySelf: "center",
              }}
            >
              {color.code ? color.code : color.name}
            </Typography>

            <Tooltip title="Swap color" sx={{
              justifySelf: "end"
            }}>
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  setSwapSourceColor(color);
                  setSwapAnchorEl(event.currentTarget);
                }}
              >
                <SwapHorizIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Buttons - right */}
            {/* <Box
              onClick={(event) => event.stopPropagation()}
              sx={{
                display: "flex",
                gap: 0.5,
                justifySelf: "end",
              }}
            >
              <Button
                size="small"
                variant="text"
                sx={{
                  minWidth: "auto",
                  px: 0.75,
                  py: 0.25,
                  fontSize: "0.6rem",
                  color: getContrastingTextColor(color.r, color.g, color.b),
                  backgroundColor: "rgba(0,0,0,0.15)",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.25)",
                  },
                }}
              >
                CLOSEST
              </Button>
            </Box> */}
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default ColorsList;
