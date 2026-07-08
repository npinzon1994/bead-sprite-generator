import { useMemo, useState } from "react";
import {
    Box,
    Popover,
    TextField,
    List,
    ListItemButton,
    Typography,
} from "@mui/material";

function getContrastingTextColor(r, g, b) {
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
}

export default function PalettePickerPopover({
    open,
    anchorEl,
    onClose,
    scrapedColors,
    sourceColor,
    onSelectColor,
}) {
    const [search, setSearch] = useState("");

    const paletteColors = useMemo(() => {
        return Object.entries(scrapedColors ?? {}).map(([colorKey, color]) => ({
            ...color,
            colorKey,
        }));
    }, [scrapedColors]);

    const filteredColors = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return paletteColors;
        }

        return paletteColors.filter((color) => {
            return (
                color.name?.toLowerCase().includes(query) ||
                color.code?.toLowerCase().includes(query) ||
                color.colorKey.toLowerCase().includes(query)
            );
        });
    }, [paletteColors, search]);

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={() => {
                setSearch("");
                onClose();
            }}
            anchorOrigin={{
                vertical: "center",
                horizontal: "left",
            }}
            transformOrigin={{
                vertical: "center",
                horizontal: "right",
            }}
        >
            <Box sx={{ width: 280, maxHeight: 420, p: 1.25 }}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>
                    Replace{" "}
                    {sourceColor?.name ??
                        `R${sourceColor?.r}G${sourceColor?.g}B${sourceColor?.b}`}
                </Typography>

                <TextField
                    size="small"
                    fullWidth
                    placeholder="Search palette..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    sx={{ mb: 1 }}
                />

                <List sx={{ maxHeight: 330, overflow: "auto", p: 0 }}>
                    {filteredColors.map((color) => {
                        const textColor = getContrastingTextColor(
                            color.r,
                            color.g,
                            color.b
                        );

                        return (
                            <ListItemButton
                                key={color.colorKey}
                                onClick={() => {
                                    onSelectColor(color);
                                    setSearch("");
                                }}
                                sx={{
                                    backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                                    color: textColor,
                                    mb: 0.5,
                                    borderRadius: 0.5,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 1,

                                    "&:hover": {
                                        backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`,
                                    },
                                }}
                            >
                                <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                                    {color.name}
                                </Typography>

                                <Typography sx={{ fontSize: "0.7rem", fontWeight: 700 }}>
                                    {color.code}
                                </Typography>
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>
        </Popover>
    );
}