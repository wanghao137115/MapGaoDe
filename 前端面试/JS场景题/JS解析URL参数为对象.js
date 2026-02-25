function getUrlParams(){
    const searchParams = new URLSearchParams(window.location.search);

    const params = {};

    for(const [key, value] of searchParams.entries()){
        params[key] = value
    }

    return params
}