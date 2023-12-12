import Pop3Command from "node-pop3";
import { simpleParser } from "mailparser";
import * as nodemailer from "nodemailer";
import {groupPrefixInSubject} from "./groupPrefixInSubject.js"
import jsonfile from "jsonfile";

let settings = await jsonfile.readFile("settings.json");
let santas = await jsonfile.readFile("santas.json");

const santaarray = santas.flatMap(s=>[s.email,s.altMail]).filter(m=>!!m).map(m=>m.toLowerCase());
let santabccs = []; const bccmax = settings.gmail_sucks.bcc_max||5;
for(let i=0;i<santaarray.length;i+=bccmax){
    santabccs.push(santaarray.slice(i, i+bccmax).join(","));
}

const pop3 = new Pop3Command(settings.pop3);
const xport = nodemailer.createTransport(settings.smtp);

const mails = await pop3.UIDL();
let mailstring
for(let i=0;i<mails.length;i++){
    mailstring = await pop3.RETR(mails[i][0]);
    let parsed = (await simpleParser(mailstring));
    if (santaarray.indexOf(parsed.from.value[0].address.toLowerCase())>-1){
        await Promise.all(
            santabccs.map(bcc=>
                xport.sendMail({
                    from:`"${parsed.from.value[0].name||parsed.from.value[0].address} via Santa"<${settings.email}>`,
                    bcc,
                    subject:groupPrefixInSubject(parsed.subject,settings.prefix),
                    text:parsed.text,
                    html:parsed.html
                })
            )
        );
    } else {
        console.log(`$cDROP: email from ${parsed.from.value[0].address}`,"color:red");
    }
    await pop3.command("DELE",mails[i][0]);
}

console.log(await pop3.QUIT());