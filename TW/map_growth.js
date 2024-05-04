/*
 * Script Name: Last Village Growth
 * Version: v1.0.7
 * Last Updated: 2023-06-15
 * Author: RedAlert
 * Author URL: https://twscripts.dev/
 * Author Contact: redalert_tw (Discord)
 * Approved: N/A
 * Approved Date: 2021-07-19
 * Mod: JawJaw
 */

/*--------------------------------------------------------------------------------------
 * This script can NOT be cloned and modified without permission from the script author.
 --------------------------------------------------------------------------------------*/

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'lastVillageGrowth',
        name: 'Last Village Growth',
        version: 'v1.0.7',
        author: 'RedAlert',
        authorUrl: 'https://twscripts.dev/',
        helpLink:
            'https://forum.tribalwars.net/index.php?threads/last-village-growth.287184/',
    },
    translations: {
        en_DK: {
            'Last Village Growth': 'Last Village Growth',
            Help: 'Help',
            'Redirecting...': 'Redirecting...',
            'There was an error fetching information!':
                'There was an error fetching information!',
            'Script is not allowed to be used on this TW market!':
                'Script is not allowed to be used on this TW market!',
        },
    },
    allowedMarkets: ['en', 'us', 'cs'],
    allowedScreens: ['map'],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

$.getScript(
    `https://twscripts.dev/scripts/twSDK.js?url=${document.currentScript.src}`,
    async function () {
        // Initialize Library
        await twSDK.init(scriptConfig);
        const scriptInfo = twSDK.scriptInfo();
        const isValidMarket = twSDK.checkValidMarket();
        const isValidScreen = twSDK.checkValidLocation('screen');

        // check if we are on a valid market
        if (!isValidMarket) {
            UI.ErrorMessage(
                twSDK.tt('Script is not allowed to be used on this TW market!')
            );
            return;
        }

        // check if the current screen is valid
        if (!isValidScreen) {
            UI.InfoMessage(twSDK.tt('Redirecting...'));
            twSDK.redirectTo('map');
            return;
        }

        if (typeof TWMap === 'undefined') TWMap = {};
        if ('TWMap' in window) mapOverlay = TWMap;

        const API_ENDPOINT = 'https://red.ibragonza.nl/api/last-village-growth';
        const { market, world, version } = game_data;

        // Script business logic
        (function () {
            let coordinates = collectCoordinatesFromMap();

            jQuery
                .ajax(
                    `${API_ENDPOINT}?market=${market}&world=${world}&version=${version}&coords=${coordinates.join(
                        ','
                    )}`
                )
                .done((response) => {
                    const { error, data } = response;
                    if (error) {
                        UI.ErrorMessage(data);
                        console.error(`${scriptInfo} Error:`, data);
                    } else {
                        const jsonData = JSON.parse(data);
                        updateMap(jsonData);
                        const customStyle = ``;
                        twSDK.renderFixedWidget(
                            '',
                            'raLastVillageGrowth',
                            'ra-last-village-growth',
                            customStyle
                        );
                    }
                })
                .catch((error) => {
                    UI.ErrorMessage(
                        twSDK.tt('There was an error fetching information!')
                    );
                    console.error(`${scriptInfo} Error:`, error);
                });
        })();

        // Helper: Add additional map layer
        function updateMap(mapData) {
            const villageCoords = [];
            const villages = [];

            for (const [_, value] of Object.entries(mapData)) {
                villageCoords.push(value.x + '|' + value.y);
                villages.push(value);
            }

            if (villageCoords.length) {
                if (mapOverlay.mapHandler._spawnSector) {
                    //exists already, don't recreate
                } else {
                    //doesn't exist yet
                    mapOverlay.mapHandler._spawnSector =
                        mapOverlay.mapHandler.spawnSector;
                }

                TWMap.mapHandler.spawnSector = function (data, sector) {
                    // Override Map Sector Spawn
                    mapOverlay.mapHandler._spawnSector(data, sector);
                    var beginX = sector.x - data.x;
                    var endX = beginX + mapOverlay.mapSubSectorSize;
                    var beginY = sector.y - data.y;
                    var endY = beginY + mapOverlay.mapSubSectorSize;

                    for (var x in data.tiles) {
                        var x = parseInt(x, 10);
                        if (x < beginX || x >= endX) {
                            continue;
                        }
                        for (var y in data.tiles[x]) {
                            var y = parseInt(y, 10);

                            if (y < beginY || y >= endY) {
                                continue;
                            }
                            var xCoord = data.x + x;
                            var yCoord = data.y + y;
                            var v = mapOverlay.villages[xCoord * 1000 + yCoord];
                            if (v) {
                                var vXY = '' + v.xy;
                                var vCoords =
                                    vXY.slice(0, 3) + '|' + vXY.slice(3, 6);
                                if (villageCoords.includes(vCoords)) {
                                    const currentVillage = villages.find(
                                        (obj) => obj.id == v.id
                                    );
                                    let eleDIV = $('<div></div>')
                                        .attr('id', 'dsm' + v.id)
                                        .html(
                                            currentVillage.lasttime +
                                                '<br>' +
                                                currentVillage.lastpoints
                                        )
                                        .css({
                                            position: 'absolute',
                                            width: '50px',
                                            height: '35px',
                                            marginTop: '0',
                                            marginLeft: '0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: '10',
                                            fontSize: '10px',
                                            textAlign: 'center',
                                        });

                                    villageMapHighlighter(
                                        eleDIV,
                                        currentVillage.lastpoints
                                    );
                                    sector.appendElement(
                                        eleDIV[0],
                                        data.x + x - sector.x,
                                        data.y + y - sector.y
                                    );
                                }
                            }
                        }
                    }
                };

                mapOverlay.reload();
            }
        }

        // Helper: Collect coordinates from the map
        function collectCoordinatesFromMap() {
            const coordinates = [];
            for (row = 0; row < 30; row++) {
                for (col = 0; col < 30; col++) {
                    coord = TWMap.map.coordByPixel(
                        TWMap.map.pos[0] + TWMap.tileSize[0] * col,
                        TWMap.map.pos[1] + TWMap.tileSize[1] * row
                    );
                    if (TWMap.villages[coord.join('')]) {
                        coordinates.push(coord[0] + '|' + coord[1]);
                    }
                }
            }
            return coordinates;
        }

        // Helper: Highlight differently based on last points growth villages on the map
        function villageMapHighlighter(el, points) {
            const academyPoints = ['+512'];
            const watchTowerPoints = [
                '+90',
                '+108',
                '+130',
                '+155',
                '+186',
                '+224',
            ];
            if (academyPoints.includes(points)) {
                el.css({
                    border: '1px solid #333',
                    backgroundColor: 'rgba(245, 43, 43, 0.9)',
                    color: '#fff',
                    textShadow: '1px 0 #222',
                    fontWeight: 'normal',
                });
            } else if (watchTowerPoints.includes(points)) {
                el.css({
                    border: '1px solid #333',
                    backgroundColor: 'rgba(0, 166, 255, 0.9)',
                    color: '#000',
                    textShadow: '1px 0 #eee',
                    fontWeight: 'bold',
                });
            } else {
                el.css({
                    border: '1px solid #333',
                    backgroundColor: 'rgba(250, 250, 236, 0.7)',
                    color: '#000',
                    textShadow: '1px 0 #eee',
                    fontWeight: 'bold',
                });
            }
        }
    }
);
