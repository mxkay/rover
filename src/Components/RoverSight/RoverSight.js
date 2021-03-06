import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Info from '../Info/Info';
import NextSol from '../NextSol/NextSol';
import PreviousSol from '../PreviousSol/PreviousSol';
import NextImage from '../NextImage/NextImage';
import PreviousImage from '../PreviousImage/PreviousImage';
import './RoverSight.css';

export default ({ rover, getManifest }) => {
  const [manifest, updateManifest] = useState({});
  const [currentImages, setcurrentImages] = useState([]);
  const [currentQuery, setCurrentQuery] = useState({ sol: 104, camera: 'NAVCAM', page: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);

  // on mount
  useEffect(() => {
    getManifest(rover).then((response) => updateManifest(response));

    const getImages = async () => {
      const res = await axios(`https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${currentQuery.sol}&camera=${currentQuery.camera}&page=${currentQuery.page}&api_key=${process.env.REACT_APP_API_KEY}`);
      const json = res.data;
      setcurrentImages(json.photos);
    };
    getImages();
  }, []);

  // get the array of images that match the current query and set that array to currentImages
  const getImages = async query => {
    const fetchImages = async () => {
      const res = await axios(`https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/photos?sol=${query.sol}&camera=${query.camera}&page=${query.page}&api_key=${process.env.REACT_APP_API_KEY}`);
      const json = res.data;
      return json.photos;
    };

    let callCount = 0;
    let newImages = await fetchImages();
    while (!newImages.length && callCount < 5) {
      newImages = await fetchImages();
      callCount++;
    }
    return newImages;
  };

  // check the manifest for any available cameras
  const scanCameras = query => {
    const newQuery = query;
    const manifestIndex = indexOfSol(query.sol);
    const cameras = manifestIndex >= 0 ? manifest.photos[manifestIndex].cameras : null;

    if (!cameras);
    else if (cameras.includes('NAVCAM')) {
      newQuery.camera = 'NAVCAM';
    } else if (cameras.includes('FHAZ')) {
      newQuery.camera = 'FHAZ';
    } else if (cameras.includes('RHAZ')) {
      newQuery.camera = 'RHAZ';
    } else if (cameras.includes('MAST')) {
      newQuery.camera = 'MAST';
    } else if (cameras.includes('PANCAM')) {
      newQuery.camera = 'PANCAM';
    } else if (cameras.includes('CHEMCAM')) {
      newQuery.camera = 'CHEMCAM';
    } else if (cameras.includes('MAHLI')) {
      newQuery.camera = 'MAHLI';
    } else if (cameras.includes('MINITES')) {
      newQuery.camera = 'MINITES';
    } else if (cameras.includes('MARDI')) {
      newQuery.camera = 'MARDI';
    }
    return newQuery;
  };

  // get the index of the given Sol in the manifest
  const indexOfSol = sol => {
    let index = 0;
    for (; index <= manifest.photos.length - 1 && manifest.photos[index].sol !== sol; index++);
    return index < manifest.photos.length ? index : -1;
  };

  // check if camera is available on this sol
  const checkCamera = query => {
    const manifestIndex = indexOfSol(query.sol);
    if (manifestIndex >= 0) {
      return manifest.photos[manifestIndex].cameras.includes(query.camera);
    } else {
      return false;
    }
  };

  // increment sol and get new images
  const nextSol = async () => {
    setCurrentIndex(0);
    let newQuery = currentQuery;
    newQuery.sol++;
    if (!checkCamera(newQuery)) newQuery = scanCameras(newQuery);
    setCurrentQuery(newQuery);
    const newImages = await getImages(newQuery);
    setcurrentImages(newImages);
  };

  // decrement sol and get new images
  const previousSol = async () => {
    setCurrentIndex(0);
    let newQuery = currentQuery;
    newQuery.sol--;
    if (!checkCamera(newQuery)) newQuery = scanCameras(newQuery);
    setCurrentQuery(newQuery);
    const newImages = await getImages(newQuery);
    setcurrentImages(newImages);
  };

  // increment image index
  const nextImage = () => {
    if (currentIndex < currentImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  // decrement image index
  const previousImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(currentImages.length - 1);
    }
  };

  return (
    <div
      className='rover-sight'
      style={{
        backgroundImage: `url(${
                currentImages[currentIndex]
                    ? currentImages[currentIndex].img_src
                    : 'https://mars.nasa.gov/system/resources/detail_files/25058_PIA23900-web.jpg'})`
      }}
    >
      {currentImages[currentIndex]
        ? (
          <Info
            qRover={rover}
            query={currentQuery}
            rover={currentImages[currentIndex].rover}
            camera={currentImages[currentIndex].camera}
            sol={currentImages[currentIndex].sol}
            earthDate={currentImages[currentIndex].earth_date}
            index={currentIndex}
            imageCount={currentImages.length}
          />
          )
        : <></>}
      <NextSol nextSol={nextSol} />
      <PreviousSol previousSol={previousSol} />
      <NextImage nextImage={nextImage} />
      <PreviousImage previousImage={previousImage} />
    </div>
  );
};
