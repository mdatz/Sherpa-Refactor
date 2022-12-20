import { Title, Text, Anchor, Center, Button, Container, Transition } from '@mantine/core';
import Image from 'next/image'
import Link from 'next/link';
import styles from './styles/index.module.css';
// import Background from '/public/images/background.jpg';
// import Foreground from '/public/images/Foreground.png';
import Background from '/public/images/FlyFishingUpscaled.jpg';

export default function HomePage() {
  return (
    <Container>
      <div className={styles.background}>
        <Image layout='fill' objectFit='cover' src={Background} priority={true}/>
      </div>
      {/* <div className={styles.foreground}>
        <Image layout='fill' objectFit='cover' src={Foreground} priority={true}/>
      </div> */}
      <Center style={{height: '80vh'}} >
      <Container style={{zIndex:1}}>
      <Title sx={{ fontSize: 100, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }} align="center">
        Welcome to{' '}
        <Text inherit variant="gradient" component="span">
          Sherpa
        </Text>
      </Title>
      <Text color="gray" align="center" size="lg" sx={{ maxWidth: 580}} mx="auto" mt="xl" style={{zIndex: -1}}>
        Are you ready for your next great adventure?
      </Text>
      <Center mt={'115px'}>
        <Link href="/login">
          <Button component="a" size="lg" variant="gradient">
            Are You 18+ or Older?
          </Button>
        </Link>
        <Button component="a" size="lg" ml='xl' variant="gradient" gradient={{ from: 'red', to: 'pink' }}>
            No, I'm just a kid
          </Button>
      </Center>
      </Container>
      </Center>
    </Container>
  );
}
