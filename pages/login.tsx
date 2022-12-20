import { Container, Center, Card, TextInput, PasswordInput, Text, Progress, Popover, Button, Divider, Alert, Box, Stepper } from '@mantine/core';
import Image from 'next/image';
import styles from './styles/login.module.css'
import { BsFacebook, BsGoogle, BsTwitter, BsLinkedin, BsFilePerson, BsKey, BsKeyFill, BsEnvelopeFill, BsXCircleFill, BsCheck } from 'react-icons/bs'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router';
import { useState } from 'react';
import Background from '/public/images/background.jpg';
import Foreground from '/public/images/Foreground.png';
import Snowfall from 'react-snowfall';
import Logo from '/public/images/Sherpa_Logo.png'

// Login card component
function LoginCard() {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);

    //Login form handler
    async function handleLogin(values: any) {

        //Send Login request to API
        setLoading(true)
        const status = await signIn('email',
            {
                email: values.email,
                callbackUrl: '/dashboard',
                redirect: false
            }
        )
        setLoading(false);
        if(status?.error) {
            //If error, set error message
            //setError(status.error);
        }else{
            //setSuccess('Email Link sent, Please check your email to log in!');
        }

    }

    return(
        <Card className={styles.loginCard} shadow='xl' radius='lg'>
            <Container>
                <Center>
                    <h1 style={{fontSize:'35px'}}><b>Sign In</b></h1>
                </Center>
                    <form>
                        <TextInput
                            placeholder="Enter your email"
                            label="Email Address"
                            radius="lg"
                            size='md'
                            mb={'35px'}
                            icon={<BsFilePerson/>}
                        />
                        <Center mt={'-30px'} mb={'30px'}>
                            <Text size='xs' color='dimmed'>We'll send you a login link. No password needed!</Text>
                        </Center>
                        <Center my={'xl'}>
                            <Button type='submit' radius="lg" size="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} style={{width: '65%'}} loading={loading}>
                                Login
                            </Button>
                        </Center>

                        {/* Error Alert Box */}
                        {error && <Alert mb='xl' title="Oops! Please try again ..." color="red" radius="lg" withCloseButton variant="outline" onClose={() => {setError(false)}}>{error}</Alert>}

                        {/* Success Alert Box */}
                        {success && <Alert mb='xl' title="Success!" color="green" radius="lg" withCloseButton variant="outline" onClose={() => {setSuccess(false)}}>{success}</Alert>}

                    </form>
                    <Divider label="or login with" labelPosition="center"/>
                    <Center mt={'xl'}>
                        <Button 
                            radius="xl" 
                            size="md"
                            onClick={() => signIn("google", {callbackUrl: `${window.location.origin}/dashboard`})} 
                            styles={(theme) => ({
                                root: {
                                    backgroundColor: '#DB4437',
                                    border: 0,
                                    height: '3rem',
                                    width: '3rem',
                                    padding: 0,
                                    margin: '0 auto',

                                    '&:hover': {
                                        backgroundColor: theme.fn.darken('#DB4437', 0.25),
                                    },
                                } 
                            })}
                        >
                            <BsGoogle size={'2em'}/>
                        </Button>
                        <Button 
                            radius="xl" 
                            size="md"
                            onClick={() => signIn("google", {callbackUrl: `${window.location.origin}/dashboard`})} 
                            styles={(theme) => ({
                                root: {
                                    backgroundColor: '#4267B2',
                                    border: 0,
                                    height: '3rem',
                                    width: '3rem',
                                    padding: 0,
                                    margin: '0 auto',

                                    '&:hover': {
                                        backgroundColor: theme.fn.darken('#4267B2', 0.25),
                                    },
                                } 
                            })}
                        >
                            <BsFacebook size={'2em'}/>
                        </Button>
                        <Button 
                            radius="xl" 
                            size="md"
                            onClick={() => signIn("google", {callbackUrl: `${window.location.origin}/dashboard`})}
                            styles={(theme) => ({
                                root: {
                                    backgroundColor: '#1DA1F2',
                                    border: 0,
                                    height: '3rem',
                                    width: '3rem',
                                    padding: 0,
                                    margin: '0 auto',

                                    '&:hover': {
                                        backgroundColor: theme.fn.darken('#1DA1F2', 0.25),
                                    },
                                } 
                            })}
                        >
                            <BsTwitter size={'2em'}/>
                        </Button>
                        <Button 
                            radius="xl" 
                            size="md"
                            onClick={() => signIn("google", {callbackUrl: `${window.location.origin}/dashboard`})}  
                            styles={(theme) => ({
                                root: {
                                    backgroundColor: '#2867b2',
                                    border: 0,
                                    height: '3rem',
                                    width: '3rem',
                                    padding: 0,
                                    margin: '0 auto',

                                    '&:hover': {
                                        backgroundColor: theme.fn.darken('#2867b2', 0.25),
                                    },
                                } 
                            })}
                        >
                            <BsLinkedin size={'2em'}/>
                        </Button>
                    </Center>
                    <Center mx='xl' mt={'35px'} style={{textAlign:'center'}}>
                        <Text color={'#555555'} size={'xs'} mt={-5} mb='md'>By clicking a Login button you agree to our <a>Terms</a>, <a>Data Policy</a> and <a>Cookies Policy</a>.</Text>
                    </Center>
            </Container>
        </Card>
    )
}

// Login page component
export default function Login() {

    //Check if the user is signed in
    const router = useRouter()
    const { data: session, status } = useSession()
    if(status === 'authenticated') {
        router.push('/dashboard')
    }

    return(
        <Container className={styles.pageContainer} fluid>
            {typeof(window) !== 'undefined' && <Snowfall />}
            <div className={styles.background}>
                <Image layout='fill' objectFit='cover' src={Background} priority={true} style={{zIndex:'0'}}/>
            </div>
            <div className={styles.gradientOverlay} />
            <div className={styles.gradientOverlayAlt} />
            <div className={styles.foreground}>
                <Image layout='fill' objectFit='cover' src={Foreground} priority={true}/>
            </div>
            <div className={styles.logo}>
                <Image
                    src={Logo}
                    alt='logo'
                    width='200px'
                    height='175px'
	    	    priority={true}
                />
            </div>
            <Container className={styles.cardContainer}>
                <LoginCard/>
            </Container>
        </Container>
    )
}