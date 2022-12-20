import { Accordion, Group, Grid, Container, Paper, Center, Text, Divider, Switch, Overlay, Loader, Kbd, Autocomplete, Modal, Header, Tabs, Skeleton, Tooltip, ActionIcon, Badge, useMantineColorScheme, Select, NumberInput, Card, Transition, TextInput, Textarea, Button, Stepper, MultiSelect, SegmentedControl, useMantineTheme, Avatar, CloseButton } from '@mantine/core';
import styles from './styles/dashboard.module.css';
import Image from 'next/image';
import { BsSearch, BsCalendar2Week, BsCheck, BsFillXCircleFill } from 'react-icons/bs'
import { RiMoonClearFill, RiSunFill, RiCoinsLine, RiCloseCircleLine, RiMapPinTimeLine, RiArrowLeftLine } from 'react-icons/ri'
import { AiOutlineFieldTime, AiOutlineFileDone, AiOutlineMessage } from 'react-icons/ai'
import { GiCornerFlag, GiUsable } from 'react-icons/gi'
import { FaUserCircle, FaSlidersH, FaSkiing, FaSignOutAlt, FaHeadset, FaUsers, FaHiking, FaMoneyBillAlt, FaClock, FaPeopleArrows, FaDollarSign, FaCommentDots} from 'react-icons/fa';
import { useDebouncedValue, useClickOutside } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { DateRangePicker, Calendar, TimeInput } from '@mantine/dates';
import { usePostings } from '../contexts/PostingProvider';
import { useRequests } from '../contexts/RequestProvider';
import { showNotification } from '@mantine/notifications';
import { intervalToDuration, isBefore } from 'date-fns';
import useSWR from "swr";
import axios from 'axios';
const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');

//Default SWR fetcher
const fetcher = (...args) => fetch(...args).then(res => res.json());

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <Group style={{position: 'absolute', bottom: '35px', right: '35px', zIndex: 100}} mt="xl">
    <Tooltip label="Light/Dark Mode" position='left' withArrow>
      <ActionIcon
        onClick={() => toggleColorScheme()}
        size="xl"
        radius='xl'
        sx={(theme) => ({
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
          color: theme.colorScheme === 'dark' ? theme.colors.yellow[4] : theme.colors.blue[6],
          border: dark ? '3px solid #FD1C12' : '3px solid #01539B',
        })}
      >
        {colorScheme === 'dark' ? (
          <RiSunFill color='#FFF' size={24} />
        ) : (
          <RiMoonClearFill color='#000' size={24} />
        )}
      </ActionIcon>
    </Tooltip>
    </Group>
  );
}


//Mapboxgl Component, functions && Callbacks
function Map({setMap, guideMode, openRequest, openPosting, setStart, setRoute, setEnd, requests, postings, setSelected, setLoading}) {

    //Default Center to Calgary
    const [center, setCenter] = useState([-114.0719, 51.0447]);
    const [current, setCurrent] = useState(false);
    const [focused, setFocused] = useState(false);
    const [popup, setPopup] = useState(null);

    const { colorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

    const border = dark ? {border: '3px solid #FD1C12', boxShadow: '0px 2px 10px rgba(175, 175, 175, 0.3)'} : {border: '3px solid #01539B', boxShadow: '0px 3px 5px rgba(1, 83, 155, 0.2)'};

    let map = null;
    var start = [];
    var end = [];
    var route = [];
    var requestMarkers = []
    var postingMarkers = []
    var interval;

    //Turn api data into GeoJSON
    function makeGeoJSON(data){
        var geoJSON = {
            "type": "FeatureCollection",
            "features": []
        }
        data.forEach(element => {
            geoJSON.features.push({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [element.location[0].lng, element.location[0].lat]
                },
                "properties": {
                    "title": element.title,
                    "description": element.description,
                    "id": element._id,
                    "category": element.category,
                    "price": element.hourlyPrice
                }
            })
        });
        return geoJSON;
    }

    //Handle double click on map
    const handleDoubleClick = (lngLat, map) => {

        if (start.length > 0 && end.length > 0) {
            
            //Clear markers
            start[0].remove();
            end[0].remove();
            
            //Call remove on all route markers
            for (var i = 0; i < route.length; i++) {
                route[i].remove();
            }

            start = [];
            end = [];
            route = [];

            setStart([]);
            setEnd([]);
            setRoute([]);
            
            if(guideMode){
                openPosting(false);
            } else {
                openRequest(false);
            }

        } else if (start.length > 0 && end.length === 0) {

            //Remove last 2 markers in route
            let last = route.pop();
            last.remove();
            last = route.pop();
            last.remove();

            //Create new div element with start icon
            let element = document.createElement('div');
            element.className = styles.finishMarker;

            //Add end marker
            const marker = new mapboxgl.Marker({element, draggable: true, anchor:'bottom-right'}).setLngLat(lngLat).addTo(map);
            end.push(marker);
            setEnd(end);

            if(guideMode){
                openPosting(true);
            } else {
                openRequest(true);
            }

        } else {

            //Create new div element with start icon
            let element = document.createElement('div');
            element.className = styles.startMarker;

            //Add start marker
            const marker = new mapboxgl.Marker({element, draggable: true, anchor:'bottom-right'}).setLngLat(lngLat).addTo(map)
            start.push(marker);
            setStart(lngLat)

            if(guideMode){
                openPosting(true);
            } else {
                openRequest(true);
            }

        }

    }

    //Handle single click on map
    const handleSingleClick = (lngLat, map) => {
        if (start.length > 0 && end.length === 0) {

            let element = document.createElement('div');
            element.className = styles.routeMarker;

            //Add route marker
            const marker = new mapboxgl.Marker({element, draggable:true, anchor:'bottom-right'}).setLngLat(lngLat).addTo(map);
            route.push(marker);
            setRoute(route);

            //Close the card to help the user understand they need to double click to place a finish marker and reopen the card...
            if(guideMode){
                openPosting(false);
            } else {
                openRequest(false);
            }
        }
    }

    //Map default settings
    const settings = {
        //maxBounds: [
        //    [-140.99778, 41.6751050889], // Southwest coordinates
        //    [-52.6480987209, 83.23324] // Northeast coordinates
        //],
        //zoom: 10,
        //minZoom: 4,
        maxZoom: 16,
        //maxPitch: 80,
        optimizeForTerrain: true,
        doubleClickZoom: false,
        refreshExpiredTiles: false,
        failIfMajorPerformanceCaveat: true
    };

    //Load map and api data into map on page load
    useEffect(() => {

        mapboxgl.accessToken = "pk.eyJ1Ijoic2hlcnBhLWRldiIsImEiOiJja3o0cjE4NGMwajBvMm9yMWo1bnRoeXJ5In0.vL-pp49tQ32UrmB3nGAvSw";
        map = new mapboxgl.Map({
            container: 'map',
            projection: 'globe',
            style: 'mapbox://styles/mapbox/outdoors-v11?optimize=true',
            center: center,
            ...settings
        });

        setMap(map);

        const geolocate = new mapboxgl.GeolocateControl({
            fitBoundsOptions: {
                maxZoom: 11
            },
            positionOptions: {
                enableHighAccuracy: true,
            },
            trackUserLocation: true
        })

        map.addControl(geolocate, 'top-left');
        geolocate.trigger();

        map.on('dblclick', function (e) {
            setCenter([e.lngLat.lng, e.lngLat.lat]);
            handleDoubleClick(e.lngLat, map);
        });

        map.on('click', function (e) {
            handleSingleClick(e.lngLat, map);

            if(current){
                setSelected(false);
                setCurrent(false);
            }
        });

        map.on('load', async () => {

            const postingsGeoJSON = postings ? makeGeoJSON(postings) : null;
            const requestsGeoJSON = requests ? makeGeoJSON(requests) : null;

            map.addSource('postings', {
                type: 'geojson',
                data: postingsGeoJSON,
                cluster: true,
                clusterMaxZoom: 14,
            });

            map.addLayer({
                id: 'postings',
                type: 'circle',
                source: 'postings',
                paint: {
                    'circle-color': '#4264fb',
                    'circle-radius': 8,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': 'rgba(255,255,255,0.8)'
                }
            });

            //Add selected posting route to map
            map.addSource('route', {
                type: 'geojson',
            });
            
            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': '#d40000',
                        'line-width': 4,
                        'line-opacity': 0.85
                    }
            });

            if(guideMode){
                map.addSource('requests', {
                    type: 'geojson',
                    data: requestsGeoJSON,
                    cluster: true,
                    clusterMaxZoom: 14
                });

                map.addLayer({
                    id: 'requests',
                    type: 'circle',
                    source: 'requests',
                    paint: {
                        'circle-color': '#B50304',
                        'circle-radius': 8,
                        'circle-stroke-width': 2,
                        'circle-stroke-color': 'rgba(255,255,255,0.8)'
                    }
                });
            } 

            map.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 15,
                'minZoom': 4,
            });

            // add the DEM source as a terrain layer with exaggerated height
            map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
            
            map.addLayer({
                'id': 'hillshading',
                'type': 'hillshade',
                'source': 'mapbox-dem',
                'minzoom': 4,
                'maxzoom': 15,
                'paint': {
                    'hillshade-illumination-direction': 0,
                    'hillshade-exaggeration': 0.25,
                    'hillshade-shadow-color': '#0A0A0A',
                    'hillshade-highlight-color': '#FFFFFF',
                    'hillshade-accent-color': '#FFFFFF'
                }
            });

            map.setFog({
                'range': [0.5, 12],
                'color': 'white',
                'horizon-blend': 0.1
            });

            // add a sky layer that will show when the map is highly pitched
            map.addLayer({
                'id': 'sky',
                'type': 'sky',
                'paint': {
                    'sky-type': 'atmosphere',
                    'sky-atmosphere-sun': [0.0, 0.0],
                    'sky-atmosphere-sun-intensity': 15,
                    'sky-atmosphere-color': 'rgba(25, 75, 150, 1.0)',
                }
            });

            // Center the map on the coordinates of any clicked circle from the 'circle' layer.
            map.on('click', ['requests', 'postings'], (e) => {
                
                //tilt camera to look at the clicked marker
                map.flyTo({
                    center: [e.features[0].geometry.coordinates[0], e.features[0].geometry.coordinates[1]],
                    zoom: 12,
                    pitch: 60
                })

                //Clear any existing pop ups
                if(popup !== null){
                    popup.remove();
                }

                const popupPanel = new mapboxgl.Popup({
                    closeButton: true,
                    className: 'popupButton',
                    offset: [0, -10]
                }).setLngLat(e.features[0].geometry.coordinates)

                //add popup
                setPopup(popupPanel);

                //create popup button html
                const popupButton = document.createElement('button');
                popupButton.className = 'popupButton';
                popupButton.style = 'background-color: #4264fb; border: none; border-radius: 13px; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 0px 0px; cursor: pointer;';
                popupButton.innerHTML = 'View Details';
                popupButton.id = e.features[0].properties.id;
                popupButton.addEventListener('click', (e) => {
                    setSelected(e.target.id);
                    setCurrent(e.target.id);
                });
                
                setSelected(e.features[0].properties.id);
                setCurrent(e.features[0].properties.id);
                setFocused(true)

                //add popup button to popup
                popupPanel.setDOMContent(popupButton);

                //add popup to map
                popupPanel.addTo(map);

                //Lookup request or posting
                const posting = postings.find(posting => posting._id === e.features[0].properties.id);
                const request = requests.find(request => request._id === e.features[0].properties.id);
                
                if(posting){
                    
                    //Turn locations into array of coordinates
                    const path = posting.location.map(location => [location.lng, location.lat])
                    const geojson = {
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'LineString',
                                coordinates: path
                            }
                    }

                    map.getSource('route').setData(geojson);

                }
                else if(request){

                    //Turn locations into array of coordinates
                    const path = request.location.map(location => [location.lng, location.lat])
                    const geojson = {
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'LineString',
                                coordinates: path
                            }
                    }

                    map.getSource('route').setData(geojson);

                }

            });
                
            // Change the cursor to a pointer when the it enters a feature in the 'circle' layer.
            map.on('mouseenter', ['requests', 'postings'], () => {
                map.getCanvas().style.cursor = 'pointer';
            });
                
            // Change it back to a pointer when it leaves.
            map.on('mouseleave', ['requests', 'postings'], () => {
                map.getCanvas().style.cursor = '';
            }); 

            //Remove Mapbox default attribution on map
            const attrib = document.getElementsByClassName('mapboxgl-ctrl-attrib')[0];
            
            if(attrib){
                attrib.style.display = 'none';
            }

            setLoading(false);
        });
          
    }, [guideMode])

    return (
            <Paper className={styles.mapContainer} shadow='xl' radius='lg' mb='xl'>
                <div id='map' className={styles.map}/>
            </Paper>
    )

}

//Loading splash screen
function LoadingOverlay(){
    return (
        <Overlay opacity={1.0} color='#fff' zIndex={999}>
            <Center style={{display: 'absolute', height: '100vh', width: '100vw'}}>
                <Container>
                    <Center>
                        <Loader size="lg" />
                    </Center>
                    <h3>Loading Map...</h3>
                </Container>
            </Center>
        </Overlay>
    )
}

function NavbarHeader({profileOpen, setProfileOpen, setSearchInput, messagesOpen, setMessagesOpen}) {

    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const theme = useMantineTheme();
    const dark = colorScheme === 'dark';

    const searchBackground = dark ? '#1a1a1a' : '#fff';
    const searchBorder = dark ? {border: '3px solid #FD1C12', boxShadow: 'rgba(100, 100, 100, 0.61) 0px 0px 10px;'} : {border: '3px solid #01539B', boxShadow: 'rgba(100, 100, 100, 0.61) 0px 0px 10px;'};

    const [searchValue, setSearchValue] = useState('')
    const [debouncedSearch] = useDebouncedValue(searchValue, 300)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [searchDates, setSearchDates] = useState(false)

    useEffect(() => {
        //Search location from Mapbox GeoSearch API
        if(debouncedSearch.length > 0){
            setLoading(true)
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${debouncedSearch}.json?types=region,place,neighborhood,poi&country=ca&access_token=pk.eyJ1Ijoic2hlcnBhLWRldiIsImEiOiJja3o0cjE4NGMwajBvMm9yMWo1bnRoeXJ5In0.vL-pp49tQ32UrmB3nGAvSw`)
            .then(res => res.json())
            .then(data => {
                //Add value to each object as the object place_name
                console.log(data)
                data.features.forEach(feature => {
                    feature.value = feature.place_name
                })
                setData(data.features)
                setLoading(false)
                return
            })
        }else{
            setData([])
            setLoading(false)
        }
    }, [debouncedSearch])

    return (
        <Header height={80} className={styles.header} p='xs'>
            {/* Mobile Nav Bar */}
                <Image src={dark ? '/images/Sherpa_Nav_Logo_Dark.png' : '/images/Sherpa_Nav_Logo.png'} height={55} width={150}/>
                <Paper className={styles.headerSearch} shadow='sm' style={searchBorder}>
                    <Autocomplete
                        id="search-location"
                        className={styles.searchBar}
                        icon={<BsSearch color={dark ? '#FD1C12' : '#01539B'} size={20} />}
                        rightSection={loading ? <Loader size={16} /> : <></>}
                        size='md'
                        radius='md'
                        placeholder="Search for a location"
                        data={data}
                        value={searchValue}
                        onChange={setSearchValue}
                        onItemSubmit={(item) => {
                            setSearchInput(item.center)
                        }}
                        variant='unstyled'
                    />
                    <Container>
                        <div className={styles.verticalDivider}/>
                    </Container>
                    <Select
                        className={styles.selectActivity}
                        icon={<FaHiking size={20} color={dark ? '#FD1C12' : '#01539B'} style={{marginRight: '5px'}} />}
                        data={['Fly Fishing', 'Ski Touring']}
                        placeholder="Select activity"
                        variant="unstyled"
                        allowDeselect
                        clearable
                    />
                    <Container>
                        <div className={styles.verticalDivider}/>
                    </Container>
                    <Select
                        className={styles.numberInput}
                        icon={<FaUsers size={20} color={dark ? '#FD1C12' : '#01539B'} style={{marginRight: '5px'}} />}
                        data={['1', '2', '3', '4', '5+']}
                        placeholder="Group Size"
                        variant="unstyled"
                        allowDeselect
                        clearable
                    />
                    <Container>
                        <div className={styles.verticalDivider}/>
                    </Container>
                    <DateRangePicker
                        className={styles.dateRangePicker}
                        icon={<BsCalendar2Week size={20} color={dark ? '#FD1C12' : '#01539B'} style={{marginRight: '5px'}} />}
                        placeholder="Select available date range"
                        variant="unstyled"
                        onChange={(date) => {
                            setSearchDates(date)
                        }}
                    />
                </Paper>
                <div className={styles.headerContent}>
                    <Tooltip label='Messages' position='bottom' withArrow>
                    <ActionIcon size='xl' radius='xl' onClick={() => setMessagesOpen(!messagesOpen)} variant='transparent'>
                        <FaCommentDots color={dark ? 'white' : 'grey'} size={32} />
                    </ActionIcon>
                    </Tooltip>
                    <Tooltip label='Profile' position='bottom' withArrow>
                    <ActionIcon size='xl' ml='5px' mr='xs' radius='xl' variant='transparent' onClick={() => setProfileOpen(!profileOpen)}>
                        <FaUserCircle color={dark ? 'white' : 'grey'} size={32} />
                    </ActionIcon>
                    </Tooltip>
                </div>
        </Header>
    )
}

function RequestPanel({setAdventureRequest, start, end, route}) {
    
        const { colorScheme } = useMantineColorScheme();
        const { data: session } = useSession()
        const dark = colorScheme === 'dark';
        const { createRequest } = useRequests();
        const [ durationType, setDurationType ] = useState('hour')

        function handleRequest(values) {

            //merge start, route, and end into one array of objects
            var location = []
            location.push(start)
            for(var i = 0; i < route.length; i++){
                location.push({lng: route[i]._lngLat.lng, lat: route[i]._lngLat.lat})
            }
            for(var i=0; i < end.length; i++){
                location.push({lng: end[i]._lngLat.lng, lat: end[i]._lngLat.lat})
            }

            const request = {
                category: values.category,
                title: values.title,
                description: values.description,
                location: location,
                dates: values.dates,
                duration: values.duration,
                startTime: values.startTime,
                unit: durationType,
                groupSize: values.groupSize,
                userId: session.user.id,
                userName: session.user.name,
                userAvatar: session.user.image
            }

            createRequest(request).then((res) => {
                if(res.success) {
                    showNotification({
                        title: 'Success!',
                        message: 'Your request has been created!',
                        color: 'green',
                        autoClose: 5000,
                    })
                    setAdventureRequest(false);
                }else{
                    showNotification({
                        title: 'Error',
                        message: 'There was an error creating your request. Please try again.',
                        color: 'red',
                        autoClose: 5000,
                    })
                }
            }).catch((err) => {
                console.log(err);    
            });

        }   

        const form = useForm({
        
            initialValues: {
                category: '',
                title: '',
                description: '',
                dates: '',
                startTime: '',
                duration: 1,
                groupSize: 1,
            },
    
            validationRules: {
                category: {
                    required: true
                },
                title: {
                    required: true,
                    minLength: 3,
                },
                description: {
                    required: true,
                    maxLength: 256,
                },
                location: {
                    required: true
                },
                dates: {
                    required: true
                },
                duration: {
                    required: true
                },
                startTime: {
                    required: true
                },
                groupSize: {
                    required: true
                }
            },
    
        });
    
        return (
            <Card radius='lg' shadow='md' className={styles.adventureRequestPanel}>
                <Card.Section>
                    <Image src={'/images/menu_images/7.jpg'} alt="adventure-request-panel" objectFit='cover' height={200} width={650}/>
                </Card.Section>
                <Card.Section>
                    <Center>
                        <Text size='xl'><h2><b>Adventure Request</b></h2></Text>
                    </Center>
                    <form onSubmit={form.onSubmit((values) => {handleRequest(values)})}>
                    <Center mx='xl' mb='xl'>
                            <Select
                                style={{width: '40%'}}
                                size='lg'
                                label='Adventure Category'
                                name='category'
                                radius='lg'
                                className={styles.selectActivity}
                                icon={<FaHiking size={20} style={{marginRight: '5px'}} />}
                                data={['Fly Fishing', 'Ski Touring']}
                                placeholder="Select activity"
                                {...form.getInputProps('category')}
                                withinPortal={false}
                                zIndex={5}
                                required
                            />
                            <DateRangePicker
                                required
                                ml='sm'
                                size='lg'
                                label='Adventure Dates'
                                name='dates'
                                radius='lg'
                                style={{width: '60%'}}
                                className={styles.dateRangePicker}
                                icon={<BsCalendar2Week size={20} style={{marginRight: '5px'}} />}
                                placeholder="Select available dates"
                                {...form.getInputProps('dates')}
                                withinPortal={false}
                            />
                        </Center>
                        <Center mx='xl' mb='xl'>
                        <TextInput
                            style={{width: '100%'}}
                            {...form.getInputProps('title')}
                            placeholder="Enter title"
                            label="Adventure Title"
                            radius="lg"
                            size='lg'
                            mr='sm'
                            icon={<FaSkiing/>}
                            required
                        />
                        <TimeInput
                            style={{width: '40%'}}
                            {...form.getInputProps('startTime')}
                            icon={<RiMapPinTimeLine/>}
                            label="Start Time"
                            size='lg'
                            radius="lg"
                            format="12"
                            required
                            clearable
                        />
                        </Center>
                        <Center mx='xl' mb='xl'>
                        <Textarea
                            style={{width: '100%'}}
                            {...form.getInputProps('description')}
                            placeholder="Enter description"
                            label="Adventure Description"
                            radius="lg"
                            size='lg'
                            icon={<FaSkiing/>}
                            maxRows={2}
                            autosize
                            required
                        />
                        </Center>
                        <Center mx='xl'>
                        <NumberInput
                            style={{width: '35%'}}
                            {...form.getInputProps('groupSize')}
                            size='lg'
                            radius='lg'
                            defaultValue={1}
                            min={1}
                            placeholder="Group Size"
                            label="Group Size"
                            required
                        />
                        <NumberInput
                            {...form.getInputProps('duration')}
                            style={{width: '35%'}}
                            ml='xl'
                            size='lg'
                            radius='lg'
                            defaultValue={1}
                            min={1}
                            max={10}
                            placeholder="Adventure Duration"
                            label="Adventure Duration"
                            required
                        />
                        <SegmentedControl
                            style={{alignSelf: 'end'}}
                            mb={'5px'}
                            ml='xl'
                            value={durationType}
                            onChange={setDurationType}
                            radius='xl'
                            color='green'
                            data={[
                                { label: 'Hours', value: 'hour' },
                                { label: 'Days', value: 'day' },
                            ]}
                        />
                        </Center>
                        <Center mt='40px' mb='30px'>
                            <Button type='submit' size='lg' radius='lg' variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 65 }} className={styles.adventureRequestButton}>
                                <Text size='lg'><b>Request Adventure</b></Text>
                            </Button>
                        </Center>
                    </form>
                </Card.Section>
                <CloseButton className={styles.closeButton} onClick={() => {setAdventureRequest(false)}}/>
            </Card>
        );
}

function PostingPanel({setAdventurePosting, start, end, route}) {

    const { colorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';
    const [ requestDates, setRequestDates ] = useState(null);
    const { createPosting } = usePostings();
    const { data: session } = useSession();
    const [ active, setActive ] = useState(0)
    const [ groupType, setGroupType ] = useState('limited')
    const [ durationType, setDurationType ] = useState('hour')
    const [ unit, setUnit ] = useState('flat')
    const [ loading, setLoading ] = useState(false);

    //merge start, route, and end into one array of objects
    var location = []
    location.push(start)
    for(var i = 0; i < route.length; i++){
        location.push({lng: route[i]._lngLat.lng, lat: route[i]._lngLat.lat})
    }
    for(var i=0; i < end.length; i++){
        location.push({lng: end[i]._lngLat.lng, lat: end[i]._lngLat.lat})
    }

    const skiEquipment = [
        { value: 'Probe', label: 'Probe' },
        { value: 'Beacon', label: 'Beacon' },
        { value: 'Shovel', label: 'Shovel' },
        { value: 'Skins', label: 'Skins' },
        { value: 'Skiis/Splitboard', label: 'Skiis/Splitboard' },
        { value: 'Poles', label: 'Poles' },
        { value: 'Boots', label: 'Boots' },
        { value: 'Helmet', label: 'Helmet' },
        { value: 'Water', label: 'Water' },
        { value: 'Food', label: 'Food' }
    ];

    const fishEquipment = [
        { value: 'Rod', label: 'Rod' },
        { value: 'Waders', label: 'Waders' },
        { value: 'Wading Boots', label: 'Wading Boots' },
        { value: 'Flys', label: 'Flys' },
        { value: 'Floatant', label: 'Floatant' },
        { value: 'Water', label: 'Water' },
        { value: 'Food', label: 'Food' }
    ];

    function handleRequest(values) {

        var unitConverted = unit;
        if(unit === 'flat'){
            if(durationType === 'day'){
                unitConverted = 'flatDay';
            } else {
                unitConverted = 'flatHour';
            }
        }

        setLoading(true);
        const posting = {
            category: values.category,
            title: values.title,
            description: values.description,
            location: location,
            dates: requestDates,
            maxGroupSize: groupType === 'unlimited' ? -1 : values.maxGroupSize,
            rate: values.rate,
            duration: values.duration,
            unit: unitConverted,
            startTime: values.startTime,
            guideId: session.user.id,
            guideName: session.user.name,
            guideAvatar: session.user.image,
            providedEquipment: values.providedEquipment,
            requiredEquipment: values.requiredEquipment,
        }

        createPosting(posting).then((res) => {
            if(res.success) {
                setLoading(false);
                showNotification({
                    title: 'Success!',
                    message: 'Your posting has been created!',
                    color: 'green',
                    autoClose: 5000,
                })
                setAdventurePosting(false);
            }else{
                setLoading(false);
                showNotification({
                    title: 'Uh Oh!',
                    message: 'There was an error creating your posting. Please try again.',
                    color: 'red',
                    autoClose: 5000,
                })
            }
        }).catch((err) => {
            console.log(err);    
        });

    }

    const form = useForm({
    
        initialValues: {
            category: '',
            title: '',
            description: '',
            duration: 1,
            maxGroupSize: 1,
            startTime: '',
            providedEquipment: '',
            requiredEquipment: '',
            rate: '',
            unit: '',
        },

        validationRules: {
            category: {
                required: true
            },
            title: {
                required: true,
                minLength: 3,
            },
            description: {
                required: true,
                maxLength: 256,
            },
            duration: {
                required: true
            },
            groupSize: {
                required: true
            },
            startTime: {
                required: true
            },
            rate: {
                required: true
            },
            unit: {
                required: true
            }
        },
    });

    return (
        <Card radius='lg' shadow='md' className={styles.adventureRequestPanel}>
            <Card.Section>
                <Image src={'/images/menu_images/7.jpg'} alt="adventure-request-panel" objectFit='cover' height={200} width={650}/>
            </Card.Section>
            <Card.Section>
                <Center style={{alignItems:'center'}}>
                    {active === 1 && <ActionIcon style={{position:'absolute', left: 0, top: 0}} size='xl' color={'gray'} onClick={() => setActive(0)}><RiArrowLeftLine size={32}/></ActionIcon>}
                    <Text size='xl'><h2><b>Adventure Posting</b></h2></Text>
                </Center>
                <form onSubmit={form.onSubmit((values) => {handleRequest(values)})}>
                {active === 0 && (
                    <>
                        <Center mx='xl' mb='xl' mt='xl'>
                                <Select
                                    style={{width: '40%'}}
                                    size='lg'
                                    label='Adventure Category'
                                    name='category'
                                    radius='lg'
                                    className={styles.selectActivity}
                                    icon={<FaHiking size={20} style={{marginRight: '5px'}} />}
                                    data={['Fly Fishing', 'Ski Touring']}
                                    placeholder="Select activity"
                                    {...form.getInputProps('category')}
                                    withinPortal={false}
                                    zIndex={5}
                                    required
                                />
                                <DateRangePicker
                                    required
                                    ml='sm'
                                    size='lg'
                                    label='Adventure Dates'
                                    name='dates'
                                    radius='lg'
                                    style={{width: '60%'}}
                                    className={styles.dateRangePicker}
                                    icon={<BsCalendar2Week size={20} style={{marginRight: '5px'}} />}
                                    placeholder="Select available dates"
                                    value={requestDates}
                                    onChange={(date) => {
                                        setRequestDates(date)
                                    }}
                                    withinPortal={false}
                                />
                            </Center>
                            <Center mx='xl' mb='xl'>
                            <TextInput
                                style={{width: '100%'}}
                                {...form.getInputProps('title')}
                                placeholder="Enter title"
                                label="Adventure Title"
                                radius="lg"
                                size='lg'
                                icon={<FaSkiing/>}
                                required
                                mr='sm'
                            />
                            <TimeInput
                                style={{width: '40%'}}
                                {...form.getInputProps('startTime')}
                                icon={<RiMapPinTimeLine/>}
                                label="Start Time"
                                size='lg'
                                radius="lg"
                                format="12"
                                required
                                clearable
                            />
                            </Center>
                            <Center mx='xl' mb='xl'>
                            <Textarea
                                style={{width: '100%'}}
                                {...form.getInputProps('description')}
                                placeholder="Enter description"
                                label="Adventure Description"
                                radius="lg"
                                size='lg'
                                icon={<FaSkiing/>}
                                maxRows={2}
                                autosize
                                required
                            />
                            </Center>
                            <Center mx='xl'>
                            <div>
                            <NumberInput
                                {...form.getInputProps('maxGroupSize')}
                                size='lg'
                                radius='lg'
                                defaultValue={1}
                                min={1}
                                placeholder="Max Group Size"
                                label="Max Group Size"
                                required
                                disabled={groupType === 'unlimited'}
                            />
                            <Center>
                                <SegmentedControl
                                    mt='sm'
                                    value={groupType}
                                    onChange={setGroupType}
                                    radius='xl'
                                    color='green'
                                    data={[
                                        { label: 'Limited', value: 'limited' },
                                        { label: 'Unlimited', value: 'unlimited' },
                                    ]}
                                />
                            </Center>

                            </div>
                            <div>
                            <NumberInput
                                {...form.getInputProps('duration')}
                                ml='xl'
                                size='lg'
                                radius='lg'
                                defaultValue={1}
                                min={1}
                                max={10}
                                placeholder="Adventure Duration"
                                label="Adventure Duration"
                                required
                            />
                            <Center>
                                <SegmentedControl
                                    mt='sm'
                                    ml='xl'
                                    radius='xl'
                                    color='green'
                                    value={durationType}
                                    onChange={setDurationType}
                                    data={[
                                        { label: 'Hours', value: 'hour' },
                                        { label: 'Days', value: 'day' },
                                    ]}
                                />
                            </Center>
                            </div>
                            </Center>
                            <Center mt='20px' mb='30px'>
                                <Button size='lg' mx='xl' radius='lg' variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 65 }} className={styles.adventureRequestButton} onClick={() => setActive(1)} fullWidth>
                                    <Text size='lg'><b>Continue</b></Text>
                                </Button>
                            </Center>
                    </>
                )}
                {active === 1 && (      
                    <>
                        <Center mx='xl' mb='xl' mt='xl'>
                            <MultiSelect
                                style={{width: '100%'}}
                                data={form.getInputProps('category') === 'Fly Fishing' ? fishEquipment : skiEquipment}
                                {...form.getInputProps('requiredEquipment')}
                                placeholder="Select equipment or add an item here..."
                                label="Required Equipment"
                                radius="lg"
                                size='lg'
                                icon={<FaSkiing/>}
                                required
                                withinPortal={false}
                                searchable
                                creatable
                                dropdownPosition="top"
                            />
                        </Center>
                        <Center mx='xl' mb='xl'>
                        <MultiSelect
                            style={{width: '100%'}}
                            data={form.getInputProps('category') === 'Fly Fishing' ? fishEquipment : skiEquipment}
                            {...form.getInputProps('providedEquipment')}
                            placeholder="Select equipment or add an item here..."
                            label="Provided Equipment"
                            radius="lg"
                            size='lg'
                            icon={<FaSkiing/>}
                            required
                            withinPortal={false}
                            searchable
                            creatable
                            dropdownPosition="top"
                        />
                        </Center>
                        <Center mx='xl' mb='xl' width='100'>
                        <NumberInput
                            style={{width: '70%'}}
                            {...form.getInputProps('rate')}
                            size='lg'
                            radius='lg'
                            defaultValue={50}
                            icon={<FaMoneyBillAlt/>}    
                            min={1}
                            placeholder="Price"
                            label="Price"
                            required
                            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                            formatter={(value) =>
                              !Number.isNaN(parseFloat(value))
                                ? `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                : '$'
                            }
                        />
                        <SegmentedControl
                            ml='md'
                            mb={'5px'}
                            value={unit}
                            onChange={setUnit}
                            radius='xl'
                            color='yellow'
                            data={durationType === 'hour' ? [
                                { label: 'Hourly', value: 'hour' },
                                { label: 'Flat Fee', value: 'flat' },
                            ]
                            : [
                                { label: 'Daily', value: 'day' },
                                { label: 'Flat Fee', value: 'flat' },
                            ]}
                            style={{alignSelf: 'flex-end'}}
                        />
                        </Center>
                        <Center mt='40px' mb='30px'>
                            <Button  type='submit' size='lg' mx='xl' radius='lg' variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 65 }} className={styles.adventureRequestButton} loading={loading} fullWidth>
                                <Text size='lg'><b>Create Posting</b></Text>
                            </Button>
                        </Center>
                    </> 
                )}
                </form>
            </Card.Section>
            <CloseButton className={styles.closeButton} onClick={() => {setAdventurePosting(false)}}/>
        </Card>
    );
}

function MessagePanel({openMessages}) {
        
    const { colorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

    return (
        <Card radius='md' shadow='xs' mb='xs' withBorder className={styles.adventurePanel}>
            <Card.Section>
                <Text size='lg'><b>My Messages</b></Text>
            </Card.Section>
            <CloseButton className={styles.closeButton} onClick={() => openMessages(false)} />
        </Card>
    );
}

function OfferLabel({ offer, request, setOpen, setAdventureId }) {

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const creationDate = new Date(offer.createdAt);
    const tripDate = new Date(offer.startDate);
    const { data: session } = useSession();

    let duration = request.duration;
    let rate = offer.rate;
    
    // Convert the duration if there is a difference in units
    if(offer.unit === 'hour') {
        duration = request.unit === 'hour' ? request.duration : request.duration * 24;
    }else if(offer.unit === 'day') {
        duration = request.unit === 'hour' ? request.duration / 24 : request.duration;
    }else if(offer.unit.includes('flat')) {
        duration = request.groupSize;
    }
        
    const price = rate * duration;
    const timeTo = intervalToDuration({ start: new Date(), end: new Date(offer.startDate) });
    const isExpired = isBefore(new Date(offer.startDate), new Date());

    function getCheckout() {

        //Send a post request to the server to get the stripe checkout url
        fetch('/api/checkout_sessions/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env["STRIPE_PUBLIC_KEY"]}`
            },
            body: JSON.stringify({
                id: offer._id,
                type: 'offer',
                userId: session.user.id,
                userName: session.user.name,
                userAvatar: session.user.image,
            })
        })
        .then(res => res.json())
        .then(data => {
            //redirect to data.url
            window.location.href = data.url;
        })
        .catch(err => console.log(err));
    
    }

    return (
          <Grid columns={12} style={{display: 'flex', alignItems: 'center'}}>
                <Grid.Col span={5}>
                <div style={{display:'flex', alignItems:'center'}}>
                    <div>
                        <Avatar size='md' radius='xl' src={offer.guideAvatar} mr='sm' />
                    </div>
                    <div>
                        <Text>{offer.guideName}</Text>
                        <Text size="sm" color="dimmed" weight={400}>
                            {tripDate.toLocaleDateString(undefined, options)}
                        </Text>
                    </div>
                </div>
                </Grid.Col>
                <Grid.Col span={4}>
                <div style={{display:'flex', alignItem: 'center'}}>
                <RiCoinsLine size={24}/>
                <Text size="sm" ml='xs' color="dimmed" weight={400}>
                ${price.toFixed(2) + ' total'}
                </Text>
                </div>
                </Grid.Col>
                <Grid.Col span={3}>
                {offer.status === 'pending' &&
                    <Button size="sm" radius="md"variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 35 }} onClick={() => getCheckout()}>
                        Accept
                    </Button> 
                }
                {offer.status === 'declined' &&
                    <Text size='xs' color='dimmed' align='center'>
                        No hard feelings!
                    </Text>
                }
                {offer.status === 'accepted' &&
                    <>
                    {timeTo.seconds > 0 && !isBefore &&
                        <Text size='xs' align='center'>
                            Upcoming in <b>{timeTo.days}</b> days & <b>{timeTo.hours}</b> hours!
                        </Text>
                    }
                    {isBefore &&
                        <Button size="sm" radius="md" variant="gradient" gradient={{ from: 'gold', to: 'red', deg: 75 }} onClick={() => {setAdventureId(offer._id);setOpen(true);}}>
                            Add Review
                        </Button> 
                    }
                    </>
                }
                {offer.status === 'reviewed' &&
                    <Text size='xs' align='center'>
                        Thanks for Adventuring with Sherpa!
                    </Text>
                }
                </Grid.Col>
          </Grid>
    );
}

function ProfilePanel({openProfile, requests, offers, adventures, postings, setGuideMode, guideMode}) {

    const { data: session, status } = useSession({required: true})
            
    const { colorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

    const [open, setOpen] = useState(false);
    const [adventureId, setAdventureId] = useState(null);
    const [rating, setRating] = useState(null);
    const [comment, setComment] = useState(null);
    const [modal, setModal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    function submitReview(){
        
        if(adventureId === null){
            return;
        }

        //Send a patch request with the review
        if(rating !== null){
            axios.patch(`/api/adventures/${adventureId}`, {
                op: 'review',
                path: '/review',
                value: [{
                    rating: rating,
                    comment: comment
                }]
            })
        }
    }

    return (
        <>
        <Card radius='md' shadow='xs' mb='xs' withBorder className={styles.adventurePanel} pr='30px' py='30px'>
            <CloseButton className={styles.closeButton} onClick={() => openProfile(false)}/>
            <div style={{display: 'flex', alignItems: 'center', height: '100%'}}>
                <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignSelf: 'flex-start', height: '100%'}}>
                    <Center mt='xl'>
                <Skeleton circle height={125} mb="xs" visible={!session} animate={status==='loading'} shadow='xl'>
                        <Avatar src={session.user.image ? session.user.image : null} size={125} mb='xs'/>
                </Skeleton>
                        </Center>
                        <Skeleton mb="xl" visible={!session} animate={status==='loading'}>
                    <Center>
                        <Text size='sm'><b>{session.user.name}</b></Text>
                    </Center>
                    <Center>
                        <Text size='xs'>{session.user.email}</Text>
                    </Center>
                        </Skeleton>
                        <div style={{marginTop: '10px'}}>
                            <Tabs grow orientation='vertical' active={activeTab} onTabChange={setActiveTab}>
                                {!guideMode && <Tabs.Tab label="Requests" icon={<GiCornerFlag size={24}/>} style={{minWidth: '200px'}}/>}
                                {guideMode && <Tabs.Tab label="Postings" icon={<GiCornerFlag size={24}/>} style={{minWidth: '200px'}}/>}
                                <Tabs.Tab label="Upcoming" icon={<AiOutlineFieldTime size={24}/>} color='red'/>
                                <Tabs.Tab label="Completed" icon={<AiOutlineFileDone size={24}/>} color='grape'/>
                                <Tabs.Tab label="Settings" icon={<FaSlidersH size={20}/>} color='green'/>
                                <Tabs.Tab label="Support" icon={<FaHeadset size={20}/>} color='cyan'/>
                            </Tabs>
                        </div>
                <div style={{marginTop: 'auto'}}>
                    {/* Remove user access in development */}
                    {(session.user.role === 'user' || session.user.role === 'guide') &&
                    <Center>
                        <Kbd mr='xs'>{'Guide'}</Kbd>
                        <Switch size='md' onLabel="ON" offLabel="OFF" checked={guideMode} onChange={() => setGuideMode(!guideMode)} />
                    </Center>
                    }
                    <Center mb='md' mt='sm'>
                        <Button variant='gradient' gradient={{ from: '#d03835', to: '#ff6b46', deg: 35 }} leftIcon={<FaSignOutAlt size={20}/>} loading={loading} onClick={() => {setLoading(true);signOut({callbackUrl:'/login'})}}>
                            Log Out
                        </Button>
                    </Center>
                </div>
                </div>
                <Paper shadow="lg" radius="md" p="sm" withBorder style={{height: '100%', width: '100%'}}>
                    {(activeTab === 0 && !guideMode) &&
                    <>
                        <Accordion iconPosition='right'>
                            {requests.map((request, index) => (
                                <Accordion.Item key={index} label={request.title}>
                                    <Text size='sm'><b>{request.category}</b></Text>
                                    <Text size='xs' color='dimmed'>{request.description}</Text>
                                    <Text size='xs' color='dimmed'>{new Date(request.dates[0]).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + " - " + new Date(request.dates[1]).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                    <Text size='xs' color='dimmed'>{request.groupSize > 1 ? request.groupSize + " people" : request.groupSize + " person"}</Text>
                                    <Text size='xs' color='dimmed'>{request.duration > 1 ? request.duration + " " + request.unit + "s" : request.duration + " " + request.unit}</Text>
                                    <Center>
                                        <Divider m='xl' style={{width:'40%'}}/>
                                        <Text>Offers</Text>
                                        <Divider m='xl' style={{width:'40%'}}/>
                                    </Center>

                                    {/* Find Offers with matching requestId and display */}
                                    {offers.filter(offer => offer.requestId === request._id).length !== 0 ? (
                                    <Accordion multiple disableIconRotation={true}> 
                                        {offers.filter(offer => offer.requestId === request._id).map((offer, index) => (
                                            <Accordion.Item key={index} label={<OfferLabel offer={offer} request={request} setOpen={setOpen} setAdventureId={setAdventureId}/>}>
                                                <Divider mb='xs'/>
                                                <Text size='sm'><b>Offer Created: </b>{new Date(offer.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                                <Text size='sm'><b>Offer Rate: </b>{offer.unit.includes('flat') ? "$" + offer.rate.toFixed(2) + " per person" : "$" + offer.rate.toFixed(2) + " per " + offer.unit}</Text>
                                                <Text size='sm'><b>Provided Equipment: </b>{offer.providedEquipment.join(", ")}</Text>
                                                <Text size='sm'><b>Required Equipment: </b>{offer.requiredEquipment.join(", ")}</Text>
                                            </Accordion.Item>
                                        ))} 
                                    </Accordion>
                            ) : (
                                <div>
                                <Center mt='md'>
                                    <Image src='/images/undraw_assets/undraw_no_offers.svg' height={200} width={200} layout='intrinsic' priority={true}/>
                                </Center>
                                <Text size='md' mt='md' color='dimmed' align='center'>No Offers Yet</Text>
                                </div>
                            )}
                                </Accordion.Item>
                            ))}
                        </Accordion>
                        {requests.length === 0 &&
                            <div style={{marginTop:'20%', marginBottom:'auto'}}>
                                <Center mt='md'>
                                    <Image src='/images/undraw_assets/undraw_no_requests.svg' height={300} width={300} layout='intrinsic' priority={true}/>
                                </Center>
                                <Text size='lg' color='dimmed' align='center'>No Requests Made</Text>
                            </div>
                        }
                    </>
                    }
                    {(activeTab === 0 && guideMode) &&
                        <>
                        <Accordion iconPosition='right'>
                            {postings.map((posting, index) => (
                                <Accordion.Item key={index} label={posting.title}>
                                    <Text size='sm'><b>{posting.category}</b></Text>
                                    <Text size='xs' color='dimmed'>{posting.description}</Text>
                                    <Text size='xs' color='dimmed'>{new Date(posting.dates[0]).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + " - " + new Date(posting.dates[1]).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                    <Text size='xs' color='dimmed'>{posting.duration > 1 ? posting.duration + " " + posting.unit + "s" : posting.duration + " " + posting.unit}</Text>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                        {postings.length === 0 &&
                            <div style={{marginTop:'20%', marginBottom:'auto'}}>
                                <Center mt='md'>
                                    <Image src='/images/undraw_assets/undraw_no_offers.svg' height={300} width={300} layout='intrinsic' priority={true}/>
                                </Center>
                                <Text size='lg' color='dimmed' align='center'>No Postings Yet</Text>
                            </div>
                        }
                        </>
                    }
                    {activeTab === 1 &&
                        <>
                        <Accordion iconPosition='right'>
                            {adventures.map((adventure, index) => (
                                <Accordion.Item key={index} label={adventure._id}>
                                    <Text size='xs' color='dimmed'>{new Date(adventure.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + " - " + new Date(adventure.endDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                        {adventures.length === 0 &&
                            <div style={{marginTop:'20%', marginBottom:'auto'}}>
                                <Center mt='md'>
                                    <Image src='/images/undraw_assets/undraw_no_adventures.svg' height={250} width={250} layout='intrinsic' priority={true}/>
                                </Center>
                                <Text size='lg' color='dimmed' align='center'>No Adventures Upcoming</Text>
                            </div>
                        }
                        </>                        
                    }
                    {activeTab === 2 &&
                        <>
                        <Accordion iconPosition='right'>
                            {adventures.map((adventure, index) => (
                                <Accordion.Item key={index} label={adventure.referenceId}>
                                    <Text size='xs' color='dimmed'>{new Date(adventure.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + " - " + new Date(adventure.endDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                        {adventures.length === 0 &&
                            <div style={{marginTop:'20%', marginBottom:'auto'}}>
                                <Center mt='md'>
                                    <Image src='/images/undraw_assets/undraw_no_completed.svg' height={250} width={250} layout='intrinsic' priority={true}/>
                                </Center>
                                <Text size='lg' color='dimmed' align='center'>No Adventures Finished</Text>
                            </div>
                        }
                        </>
                    }
                    {activeTab === 3 &&
                        <Center mt='xl'>
                            <Text size='xl'><b>Settings</b></Text>
                        </Center>
                    }
                    {activeTab === 4 &&
                        <Center mt='xl'>
                            <Text size='xl'><b>Support</b></Text>    
                        </Center>
                    }
                    </Paper>
            </div>
        </Card>
        <Modal ref={setModal} size={'100'} opened={open} onClose={() => setOpen(false)} transition='slide-down' transitionDuration={600} centered inPortal={false}>
            <Center mt='-60px' style={{width: '400px'}}>
                <Text size='xl'><h2><b>Review Adventure</b></h2></Text>
            </Center>
            <Divider/>
            <Center mt='md'>
                <Text size='md'><b>Guide Rating</b></Text>
            </Center>
            <Center mt='3px'>
                    {/* Add Rating Component Here */}
            </Center>
            <Center mt='3px'>
                <Textarea
                    label='Comments'
                    style={{width: '100%'}}
                    variant='filled'
                    minRows={5}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                />
            </Center>
            <Center mt='xl'>
                <Button size='lg' radius='lg' variant="gradient" gradient={{ from: 'teal', to: 'blue', deg: 42 }} className={styles.adventureRequestButton} onClick={() => submitReview()} fullWidth>
                    <Text size='lg'><b>Submit Review</b></Text>
                </Button>
            </Center>
        </Modal>
        </>
    );
}

function RequestDetails({request, setSelected}){

    const { colorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { data: session } = useSession()
    const [ unit, setUnit ] = useState('flat')
    
    const skiEquipment = [
        { value: 'Probe', label: 'Probe' },
        { value: 'Beacon', label: 'Beacon' },
        { value: 'Shovel', label: 'Shovel' },
        { value: 'Skins', label: 'Skins' },
        { value: 'Skiis/Splitboard', label: 'Skiis/Splitboard' },
        { value: 'Poles', label: 'Poles' },
        { value: 'Boots', label: 'Boots' },
        { value: 'Helmet', label: 'Helmet' },
        { value: 'Water', label: 'Water' },
        { value: 'Food', label: 'Food' }
    ];

    const fishEquipment = [
        { value: 'Rod', label: 'Rod' },
        { value: 'Waders', label: 'Waders' },
        { value: 'Wading Boots', label: 'Wading Boots' },
        { value: 'Flys', label: 'Flys' },
        { value: 'Floatant', label: 'Floatant' },
        { value: 'Water', label: 'Water' },
        { value: 'Food', label: 'Food' }
    ];


    const form = useForm({
    
        initialValues: {
            rate: 0,
            providedEquipment: '',
            requiredEquipment: '',
            startDate: '',
            startTime: '',
        },

        validationRules: {
            rate: {
                required: true,
            },
            providedEquipment: {
                required: true
            },
            requiredEquipment: {
                required: true
            },
            startDate: {
                required: true
            },
            startTime: {
                required: true
            }
        },

    });

    function handleOffer(values){
        
        var unitConverted = unit;
        if(unit === 'flat'){
            if(request.unit === 'day'){
                unitConverted = 'flatDay';
            } else {
                unitConverted = 'flatHour';
            }
        }

        const offer = {
            requestId: request._id,
            startDate: values.startDate,
            startTime: values.startTime,
            rate: values.rate,
            unit: unitConverted,
            guideId: session.user.id,
            guideName: session.user.name,
            guideAvatar: session.user.image,
            providedEquipment: values.providedEquipment,
            requiredEquipment: values.requiredEquipment,
        }

        fetch('/api/offers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(offer)
        }).then(res => res.json()).then(data => {
            setLoading(false)
            if(data.success){
                showNotification({
                    title: 'Success!',
                    message: 'Your offer has been sent!',
                    color: 'green',
                    autoClose: 5000,
                })
                setOpen(false);
                setSelected(false);
            }else{
                showNotification({
                    title: 'Error',
                    message: 'There was an error submitting your offer. Please try again.',
                    color: 'red',
                    autoClose: 5000,
                })
            }
        })
    }

    const checkDate = (date) => {
        //Check for null dates
        if(date === null){
            return false
        }else{
            //Check if date is in the postings date array
            const toCheck = new Date(date).getTime();
            
            //Check if date is in the postings date range
            if(new Date(request.dates[0]).getTime() <= toCheck && new Date(request.dates[request.dates.length-1]).getTime() >= toCheck){
                console.log(true)
                return true
            }else{
                return false
            }
        }
    }

    //Check for custom flat day or flat hour unit
    var unitCorrected = request.unit;
    if(request.unit === 'flatDay'){
        unitCorrected = 'day';
    }else if(request.unit === 'flatHour'){
        unitCorrected = 'hour';
    }

    return (
        <>
        <Card radius='lg' shadow='md' className={styles.detailsPanel}>
        <Card.Section>
            <Image src={request.category === 'Fly Fishing' ? '/images/menu_images/9.jpg' : '/images/menu_images/8.jpg'} alt="adventure-request-panel" objectFit='cover' height={150} width={425} priority={true}/>
        </Card.Section>
        <CloseButton className={styles.closeButton} onClick={() => setSelected(false)}/>
        <Card.Section>
            <Center mx='xl'>
                <Avatar size='xl' radius='50px' src={request.userAvatar} mr='md' />
                <Text size='xl' style={{lineHeight: '2rem'}}><h2><b>{request.title}</b></h2></Text>
            </Center>
            <Center mt={'5px'}>
            {request.category === 'Fly Fishing' ? (  
                <Badge variant="gradient" gradient={{ from: 'grape', to: 'yellow', deg: 35 }}>Fly Fishing</Badge>
            ) : (
                <Badge variant="gradient" gradient={{ from: 'blue', to: 'teal', deg: 35 }}>Ski Touring</Badge>
            )}
            <Badge variant="gradient" gradient={{ from: 'pink', to: 'grape', deg: 115 }} ml='xs'>User Request</Badge>
            </Center>
                <Center mt='md' mx='xl'>
                    <Text size='lg'>{request.description}</Text>
                </Center>
                <Center mt='xl'>
                    <FaPeopleArrows style={{marginRight: '5px'}}/>
                    <Text size='lg'>{request.groupSize} people</Text>
                    <FaClock style={{marginRight: '5px', marginLeft: '20px'}}/>
                    <Text size='lg'>{request.duration} {unitCorrected}</Text>
                </Center>
                <Divider m='xl'/>
                <Center mt='xl' mx='xl' mb='xl'>
                    <Button size='lg' radius='lg' variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 65 }} className={styles.adventureRequestButton} onClick={() => setOpen(true)} fullWidth>
                        <Text size='lg'><b>Send Offer</b></Text>
                    </Button>
                </Center>
        </Card.Section>
        </Card>
        <Modal size={'100'} opened={open} onClose={() => setOpen(false)} transition='slide-down' transitionDuration={600} centered inPortal={false}>
            <form onSubmit={form.onSubmit((values) => {handleOffer(values)})}>
            <Center mt='-60px'>
                <Text size='xl'><h2><b>Create an Offer</b></h2></Text>
            </Center>
            <Center my='xl'>
                <Calendar size='lg' amountOfMonths={2} {...form.getInputProps('startDate')} excludeDate={(date) => !checkDate(date)}/>
            </Center>
            <Center mx='xl' mb='xl' mt='xl'>
                <MultiSelect
                    style={{width: '100%'}}
                    data={request.category === 'Fly Fishing' ? fishEquipment : skiEquipment}
                    {...form.getInputProps('requiredEquipment')}
                    placeholder="Select equipment or add an item here..."
                    label="Required Equipment"
                    radius="lg"
                    size='lg'
                    icon={<FaSkiing/>}
                    required
                    withinPortal={false}
                    searchable
                    creatable
                    dropdownPosition="bottom"
                />
            </Center>
            <Center mx='xl' mb='xl'>
                <MultiSelect
                    style={{width: '100%'}}
                    data={request.category === 'Fly Fishing' ? fishEquipment : skiEquipment} 
                    {...form.getInputProps('providedEquipment')}
                    placeholder="Select equipment or add an item here..."
                    label="Provided Equipment"
                    radius="lg"
                    size='lg'
                    icon={<FaSkiing/>}
                    required
                    withinPortal={false}
                    searchable
                    creatable
                    dropdownPosition="top"
                />
            </Center>
            <Center mb='xl'>
            <TimeInput
                {...form.getInputProps('startTime')}
                icon={<RiMapPinTimeLine/>}
                label="Start Time"
                size='lg'
                radius="lg"
                format="12"
                required
                clearable
                mr='md'
            />
            <NumberInput
                {...form.getInputProps('rate')}
                size='lg'
                radius='lg'
                defaultValue={50}
                icon={<FaMoneyBillAlt/>}    
                min={1}
                placeholder="Price"
                label="Price"
                required
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    formatter={(value) =>
                        !Number.isNaN(parseFloat(value))
                            ? `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            : '$'
                        }
            />
            <SegmentedControl
                ml='sm'
                mb={'5px'}
                value={unit}
                color='green'
                size='sm'
                radius='xl'
                onChange={setUnit}
                data={request.unit === 'hour' ? [
                        { label: 'Hourly', value: 'hour' },
                        { label: 'Flat Fee', value: 'flat' },
                    ] : [
                        { label: 'Daily', value: 'day' },
                        { label: 'Flat Fee', value: 'flat' },
                    ]}
                style={{alignSelf: 'end'}}
            />
            </Center>
            <Divider m='xl'/>
            <Center mt='xl'>
                <Button type='submit' size='lg' radius='lg' variant="gradient" gradient={{ from: 'grape', to: 'teal', deg: 70 }} className={styles.adventureRequestButton} loading={loading} onClick={() => {setLoading(true)}} fullWidth>
                    <Text size='lg'><b>Send Offer</b></Text>
                </Button>
            </Center>
            </form>
        </Modal>
        </>
    )

}

function PostingDetails({posting, setSelected}){

    const { colorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';
    const { data: session } = useSession();
    const [groupSize, setGroupSize] = useState(1);

    const checkDate = (date) => {
        //Check for null dates
        if(date === null){
            return false
        }else{
            //Check if date is in the postings date array
            const toCheck = new Date(date).getTime();
            
            //Check if date is in the postings date range
            if(new Date(posting.dates[0]).getTime() <= toCheck && new Date(posting.dates[posting.dates.length-1]).getTime() >= toCheck){
                return true
            }else{
                return false
            }
        }
    }

    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(null);
    const [loading, setLoading] = useState(false);

    function getCheckout() {

        //Send a post request to the server to get the stripe checkout url
        fetch('/api/checkout_sessions/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env["STRIPE_PUBLIC_KEY"]}`
            },
            body: JSON.stringify({
                id: posting._id,
                type: 'posting',
                userId: session.user.id,
                userName: session.user.name,
                userAvatar: session.user.image,
                groupSize: groupSize,
                startDate: date
            })
        })
        .then(res => res.json())
        .then(data => {
            //redirect to data.url
            window.location.href = data.url;
        })
        .catch(err => console.log(err));
    
    }

    //Check for custom flat day or flat hour unit
    var unitCorrected = posting.unit;
    if(unitCorrected === 'flatDay'){
        unitCorrected = 'day';
    }else if(unitCorrected === 'flatHour'){
        unitCorrected = 'hour';
    }

    return (
        <>
        <Card radius='lg' shadow='md' className={styles.detailsPanel} closeButton>
            <Card.Section>
                <Image src={posting.category === 'Fly Fishing' ? '/images/menu_images/9.jpg' : '/images/menu_images/8.jpg'} alt="adventure-request-panel" objectFit='cover' height={150} width={425} priority={true}/>
            </Card.Section>
            <CloseButton className={styles.closeButton} onClick={() => setSelected(false)}/>
            <Card.Section>
                    <Center mx='xl'>
                        <Avatar size='xl' radius='50px' src={posting.guideAvatar} mr='md' />
                        <Text size='xl'><h2><b>{posting.title}</b></h2></Text>
                    </Center>
                    <Center mt={'-15px'}>
                    {posting.category === 'Fly Fishing' ? (  
                        <Badge variant="gradient" gradient={{ from: 'grape', to: 'yellow', deg: 35 }}>Fly Fishing</Badge>
                    ) : (
                        <Badge variant="gradient" gradient={{ from: 'blue', to: 'teal', deg: 35 }}>Ski Touring</Badge>
                    )}
                    <Badge variant="gradient" gradient={{ from: 'red', to: 'pink', deg: 115 }} ml='xs'>Guide Posting</Badge>
                    </Center>
                <Center mt='xl' mx='xl'>
                    <Text size='lg'>{posting.description}</Text>
                </Center>
                <Center mt='xl'>
                    <FaPeopleArrows style={{marginRight: '5px'}}/>
                    <Text size='lg'>{posting.maxGroupSize !== -1 ? `${posting.maxGroupSize} people (max)` : `Any size`}</Text>
                    <FaClock style={{marginRight: '5px', marginLeft: '20px'}}/>
                    <Text size='lg'>{posting.duration} {unitCorrected}</Text>
                </Center>
                <Center mt='xl'>
                        <FaDollarSign style={{marginRight: '5px'}}/>
                        <Text size='lg'>{posting.rate.toFixed(2)} CAD{posting.unit.includes('flat') ? "" : `/${posting.unit}`}</Text>
                </Center>
                <Divider m='xl'/>
                <Center mt='xl' mx='xl' mb='xl'>
                    <Button size='lg' radius='lg' variant="gradient" gradient={{ from: 'teal', to: 'lime', deg: 65 }} className={styles.adventureRequestButton} fullWidth onClick={() => setOpen(true)}>
                        <Text size='lg'><b>See Available Dates</b></Text>
                    </Button>
                </Center>
            </Card.Section>
        </Card>
        <Modal size={'100'} opened={open} onClose={() => setOpen(false)} transition='slide-down' transitionDuration={600} centered inPortal={false}>
            <Center mt='-60px'>
                <Text size='xl'><h2><b>Join an Adventure</b></h2></Text>
            </Center>
            <Center mt='md'>
                <Calendar size='lg' amountOfMonths={2} value={date} onChange={setDate} 
                    // dayStyle={(date) => checkDate(date) ? { backgroundColor: 'green', borderRadius: '50%', color: 'white', zIndex: 0 } : null}
                    excludeDate={(date) => !checkDate(date)}
                />
            </Center>
            <Center>
                <NumberInput
                    style={{width: '35%'}}
                    size='lg'
                    radius='lg'
                    defaultValue={groupSize}
                    onChange={(val) => setGroupSize(val)}
                    min={1}
                    max={posting.maxGroupSize > 0 ? posting.maxGroupSize : 100}
                    placeholder="Group Size"
                    label="Group Size"
                    mr='xl'
                    required
                />
            </Center>
            <Center mt='md'>
                <Text size='lg'><b>Selected Date: </b>{date === null ? "Please select a date" : new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </Center>
            <Divider m='xl'/>
            <Center mt='xl'>
                <Button size='lg' radius='lg' variant="gradient" gradient={{ from: 'teal', to: 'blue', deg: 42 }} className={styles.adventureRequestButton} loading={loading} onClick={() => {setLoading(true); getCheckout()}} disabled={date===false} fullWidth>
                    <Text size='lg'><b>Continue to Payment</b></Text>
                </Button>
            </Center>
        </Modal>
        </>
    );
}

function AdventureDetailsPanel({selected, setSelected, postings, requests}) {

    const { colorScheme } = useMantineColorScheme();
    const dark = colorScheme === 'dark';
    
    var posting = postings.find(posting => posting._id === selected);
    var request = requests.find(request => request._id === selected);

    useEffect(() => {
        posting = postings.find(posting => posting._id === selected);
        request = requests.find(request => request._id === selected);
    }, [selected]);

    return (
        <>
        {posting && <PostingDetails posting={posting} setSelected={setSelected} />}
        {request && <RequestDetails request={request} setSelected={setSelected} />}
        </>
    );
}

export default function Dashboard(){

    const [guideMode, setGuideMode] = useState(false);

    //Check for user session and redirect to login if not logged in
    const router = useRouter()
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            router.push('/login')
        }
    })

    //API calls
    const { data: postings, error: postingError } = useSWR('/api/postings', fetcher);
    const { data: requests, error: requestError } = useSWR('/api/requests', fetcher);
    const { data: offers, error: offerError } = useSWR('/api/offers', fetcher);
    const { data: adventures, error: adventureError } = useSWR('/api/adventures/', fetcher);

    const [messages, openMessages] = useState(false);
    const [profile, openProfile] = useState(false);
    const [selected, setSelected] = useState(false);
    const [searchInput, setSearchInput] = useState(null);
    const [map, setMap] = useState(null);
    const [mode, setMode] = useState('user');

    // State variables for posting, requests, & proposal cards
    const [adventureRequest, setAdventureRequest] = useState(false);
    const [adventurePosting, setAdventurePosting] = useState(false);

    // State variables for creating adventure routes on map
    const [start, setStart] = useState([]);
    const [route, setRoute] = useState([]);
    const [end, setEnd] = useState([]);

    //Let map load behind loading screen for smoother experience
    const [mapLoading, setMapLoading] = useState(true);

    //Fly To location if search input is selected and map is available
    useEffect(() => {
        if(searchInput?.length > 0 && map !== null){
            map.flyTo({
                center: searchInput,
                zoom: 12
            });
        }
    }, [searchInput]);

    // var posting = postings.find(posting => posting._id === selected);
    // var request = requests.find(request => request._id === selected);

    // useEffect(() => {
    //     posting = postings.find(posting => posting._id === selected);
    //     request = requests.find(request => request._id === selected);
    // }, [selected]);

    //Check for stripe checkout completion or failure
    useEffect(() => {

        const params = new URLSearchParams(window.location.search);
        if(params.get('success')){

            // Successful checkout
            if(params.get('adventure_id')){

                // Successful checkout for adventure
                const id = params.get('adventure_id');

                // need to verify stripe checkout id too, to prevent api exploition

                // Send axios patch request to update adventure status
                axios.patch(`/api/adventures/${id}`, {
                    op: 'update',
                    path: '/stripeCheckoutStatus',
                    value: 'success'
                })

                if(params.get('offer_id')){
                    
                    // Get the offer being accepted
                    const offerId = params.get('offer_id');

                    // Send axios post request to update offer status
                    axios.post(`/api/offers/${offerId}`, {
                        op: 'accept'
                    })
                    
                }

            }

        }else if(params.get('canceled')){

            // Canceled checkout
            if(params.get('adventure_id')){
                // Canceled checkout for adventure
                const id = params.get('adventure_id');
                
                // Send axios patch request
                axios.patch(`/api/adventures/${id}`, {
                    op: 'update',
                    path: '/stripeCheckoutStatus',
                    value: 'canceled'
                })
            }

        }else if(params.get('error')){
            // Error checkout
            console.log('Error checkout');
        }

        //Attempting to clear url params but also kinda sus
        //window.history.replaceState(null, null, window.location.pathname);

    }, []);

    return(     
            <>
                {(mapLoading || !postings) ? (<LoadingOverlay/>) : (<></>)}
                    <div style={{width:'100vw', height: '100vh'}}>
                    <NavbarHeader profileOpen={profile} setProfileOpen={openProfile} setSearchInput={setSearchInput} messagesOpen={messages} setMessagesOpen={openMessages}/>
                    {postings && requests ? 
                        <Map setMap={setMap} guideMode={guideMode} openRequest={setAdventureRequest} openPosting={setAdventurePosting} setStart={setStart} setRoute={setRoute} setEnd={setEnd} postings={postings} requests={requests} setSelected={setSelected} setLoading={setMapLoading} searchInput={searchInput}/> 
                    : <></>}
                    <Transition mounted={messages} duration={400} transition='fade'>
                        {(styles) => <div style={styles}><MessagePanel openMessages={openMessages}/></div>}
                    </Transition>
                    <Transition mounted={profile} duration={400} transition='fade'>
                        {(styles) => <div style={styles}><ProfilePanel openProfile={openProfile} requests={requests} offers={offers} adventures={adventures} postings={postings} guideMode={guideMode} setGuideMode={setGuideMode}/></div>}
                    </Transition>
                    <Transition mounted={adventureRequest} duration={400} transition='fade'>
                        {(styles) => <div style={styles}><RequestPanel setAdventureRequest={setAdventureRequest} start={start} end={end} route={route}/></div>}
                    </Transition>
                    <Transition mounted={adventurePosting} duration={400} transition='fade'>
                        {(styles) => <div style={styles}><PostingPanel setAdventurePosting={setAdventurePosting} start={start} end={end} route={route}/></div>}
                    </Transition>
                    <Transition mounted={selected} duration={400} transition='fade'>
                        {(styles) => <div style={styles}><AdventureDetailsPanel selected={selected} setSelected={setSelected} postings={postings} requests={requests}/></div>}
                    </Transition>
                    <ColorSchemeToggle/>
                    </div>
            </>
    )

}