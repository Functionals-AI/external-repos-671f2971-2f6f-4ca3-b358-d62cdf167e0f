function Robots() {
}

export async function getServerSideProps({ res }) {
    res.setHeader('Content-Type', 'text/plain');
    res.write(`User-agent: *\nDisallow: /`);
    res.end();

    return {
      props: {},
    };
}

export default Robots;