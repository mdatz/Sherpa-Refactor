import { Container, Stack, Center, Card, TextInput, PasswordInput, Text, Progress, Popover, Button, Divider, Alert, Box, Stepper } from '@mantine/core';
import Image from 'next/image';
import NoMobile from '/public/images/undraw_assets/undraw_no_mobile.svg';

export default function Mobile() {

    return(
        <Container mt='5rem'>
            <Stack align='center'>
                <Image layout='intrinsic' objectFit='contain' src={NoMobile} priority={true}/>
                <Text size='xl' weight={800}>Mobile Site in Development!</Text>
            </Stack>
        </Container>
    )
}