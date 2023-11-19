import Pop3Command from "node-pop3";
import { simpleParser } from "mailparser";
import * as nodemailer from "nodemailer";
import {groupPrefixInSubject} from "./groupPrefixInSubject.js"
import jsonfile from "jsonfile";

let settings = await jsonfile.readFile("settings.json");
let santas = await jsonfile.readFile("santas.json");

let dropped = await jsonfile.readFile("dropped.json",{flag:'a+'}).catch(err=>({}));
const santabcc = santaarray.join(",");

const pop3 = new Pop3Command(settings.pop3);
const xport = nodemailer.createTransport(settings.smtp);

const mails = await pop3.UIDL();
console.log(mails);
let mailstring
for(let i=0;i<mails.length;i++){
    mailstring = await pop3.RETR(mails[i][0]);
    let parsed = (await simpleParser(mailstring));

    console.log(parsed.from.value[0].address);
    console.log(`${parsed.subject} from ${parsed.from.value[0].address}`);
    console.log(`${santaarray.indexOf(parsed.from.value[0].address)}`);

    if (santaarray.indexOf(parsed.from.value[0].address)>-1){
        await xport.sendMail({
            from:`"${parsed.from.value[0].name}"<${settings.email}>`,
            bcc:santabcc,
            subject:groupPrefixInSubject(parsed.subject,settings.prefix),
            text:parsed.text,
            html:parsed.html
        });
    } else {
        if (dropped[parsed.from.value[0].address]) dropped[parsed.from.value[0].address]++;
        else dropped[parsed.from.value[0].address]=1;
    }
    await pop3.command("DELE",mails[i][0]);
}

console.log(await pop3.QUIT());