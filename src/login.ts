import formData from "form-data";
import {CookieJar} from "tough-cookie";
import {promisify} from "util";
import got from "got";

export async function login(name: string, password: string) {
    const form = new formData()

    form.append('meno',name);
    form.append('heslo',password);
    form.append('akcia','login');

    const cookieJar = new CookieJar();
    const setCookie = promisify(cookieJar.setCookie.bind(cookieJar));

    const authResponse = await got.post('https://portal.edupage.org/index.php?jwid=jw2&module=Login', {body: form})
    const profileUrl = authResponse.body.split('window.open("')[1].split('"')[0]
    const school = profileUrl.split('https://')[1].split('.edupage.org')[0]
    await setCookie(authResponse.headers["set-cookie"][0], `https://${school}.edupage.org/`);
    await setCookie(authResponse.headers["set-cookie"][1], `https://${school}.edupage.org/`);


    const dataResponse = await got.get(profileUrl, {cookieJar})
    return JSON.parse(dataResponse.body
        .split("$j(document).ready(function() {")[1]
        .split(");")[0]
        .replace("\t", "")
        .split("userhome(")[1]
        .replace("\n", "")
        .replace("\r", ""))
}
