// The 193 UN member states.
// Fields: ISO 3166 alpha-2 | 3-letter team code | name | confederation | strength | kit primary | kit secondary
// Confederations: E Europe, A Asia, F Africa, N North & Central America, S South America, O Oceania.
// Strength (25-90) is an in-game estimate of each team's level, not an official ranking.
const RAW = `
AF|AFG|Afghanistan|A|44|d32011|000000
AL|ALB|Albania|E|69|e41e20|000000
DZ|ALG|Algeria|F|75|ffffff|006233
AD|AND|Andorra|E|42|1e3a8a|fedf00
AO|ANG|Angola|F|62|cc092f|000000
AG|ATG|Antigua and Barbuda|N|42|ce1126|000000
AR|ARG|Argentina|S|89|75aadb|ffffff
AM|ARM|Armenia|E|62|d90012|0033a0
AU|AUS|Australia|A|75|ffcd00|00843d
AT|AUT|Austria|E|79|ed2939|ffffff
AZ|AZE|Azerbaijan|E|58|0092bc|ffffff
BS|BAH|Bahamas|N|38|00abc9|ffc72c
BH|BHR|Bahrain|A|60|ce1126|ffffff
BD|BAN|Bangladesh|A|44|006a4e|f42a41
BB|BRB|Barbados|N|42|00267f|ffc726
BY|BLR|Belarus|E|58|ffffff|c8313e
BE|BEL|Belgium|E|82|e30613|000000
BZ|BLZ|Belize|N|40|003f87|ce1126
BJ|BEN|Benin|F|58|ffd600|008751
BT|BHU|Bhutan|A|36|ff6600|ffd520
BO|BOL|Bolivia|S|58|00994e|ffffff
BA|BIH|Bosnia and Herzegovina|E|66|002395|fecb00
BW|BOT|Botswana|F|50|75aadb|000000
BR|BRA|Brazil|S|87|fedd00|1c3f94
BN|BRU|Brunei|A|36|f7e017|000000
BG|BUL|Bulgaria|E|60|ffffff|00966e
BF|BFA|Burkina Faso|F|65|ffffff|009e49
BI|BDI|Burundi|F|50|ce1126|1eb53a
CV|CPV|Cabo Verde|F|64|003893|cf2027
KH|CAM|Cambodia|A|40|032ea1|e00025
CM|CMR|Cameroon|F|70|007a5e|ce1126
CA|CAN|Canada|N|75|d80621|ffffff
CF|CTA|Central African Republic|F|50|003082|ffce00
TD|CHA|Chad|F|42|002664|fecb00
CL|CHI|Chile|S|70|d52b1e|0039a6
CN|CHN|China|A|58|de2910|ffffff
CO|COL|Colombia|S|82|fcd116|003893
KM|COM|Comoros|F|52|3a75c4|ffffff
CG|CGO|Congo|F|54|009543|fbde4a
CR|CRC|Costa Rica|N|66|ce1126|002b7f
CI|CIV|Côte d'Ivoire|F|76|ff8200|009e60
HR|CRO|Croatia|E|83|ffffff|ff0000
CU|CUB|Cuba|N|42|cf142b|002a8f
CY|CYP|Cyprus|E|52|1e40af|ffffff
CZ|CZE|Czechia|E|72|d7141a|ffffff
KP|PRK|North Korea|A|52|ed1c27|ffffff
CD|COD|DR Congo|F|68|007fff|ce1021
DK|DEN|Denmark|E|80|c60c30|ffffff
DJ|DJI|Djibouti|F|36|6ab2e7|12ad2b
DM|DMA|Dominica|N|38|006b3f|fcd116
DO|DOM|Dominican Republic|N|46|002d62|ce1126
EC|ECU|Ecuador|S|78|ffdd00|034ea2
EG|EGY|Egypt|F|72|ce1126|ffffff
SV|SLV|El Salvador|N|52|0f47af|ffffff
GQ|EQG|Equatorial Guinea|F|56|e32118|3e9a00
ER|ERI|Eritrea|F|36|4189dd|ea0437
EE|EST|Estonia|E|52|0072ce|000000
SZ|SWZ|Eswatini|F|44|3e5eb9|ffd900
ET|ETH|Ethiopia|F|48|078930|fcdd09
FJ|FIJ|Fiji|O|44|ffffff|002868
FI|FIN|Finland|E|66|ffffff|002f6c
FR|FRA|France|E|89|002654|ffffff
GA|GAB|Gabon|F|62|fcd116|009e60
GM|GAM|Gambia|F|56|ce1126|0c1c8c
GE|GEO|Georgia|E|69|ffffff|e8112d
DE|GER|Germany|E|85|ffffff|000000
GH|GHA|Ghana|F|70|ffffff|000000
GR|GRE|Greece|E|71|0d5eaf|ffffff
GD|GRN|Grenada|N|40|ce1126|fcd116
GT|GUA|Guatemala|N|54|4997d0|ffffff
GN|GUI|Guinea|F|62|ce1126|fcd116
GW|GNB|Guinea-Bissau|F|52|ce1126|009e49
GY|GUY|Guyana|N|46|009e49|fcd116
HT|HAI|Haiti|N|52|00209f|d21034
HN|HON|Honduras|N|58|ffffff|0073cf
HU|HUN|Hungary|E|74|ce2939|ffffff
IS|ISL|Iceland|E|62|02529c|ffffff
IN|IND|India|A|46|1e60c8|ff9933
ID|IDN|Indonesia|A|52|ce1126|ffffff
IR|IRN|Iran|A|76|ffffff|da0000
IQ|IRQ|Iraq|A|62|ffffff|007a3d
IE|IRL|Ireland|E|68|169b62|ffffff
IL|ISR|Israel|E|62|ffffff|0038b8
IT|ITA|Italy|E|83|0064aa|ffffff
JM|JAM|Jamaica|N|60|fed100|009b3a
JP|JPN|Japan|A|80|0b1f5c|ffffff
JO|JOR|Jordan|A|64|ffffff|ce1126
KZ|KAZ|Kazakhstan|E|56|00afca|fec50c
KE|KEN|Kenya|F|52|bb0000|006600
KI|KIR|Kiribati|O|30|ce1126|fcd116
KW|KUW|Kuwait|A|50|0047ab|ffffff
KG|KGZ|Kyrgyzstan|A|52|e8112d|ffef00
LA|LAO|Laos|A|38|ce1126|002868
LV|LVA|Latvia|E|50|9e3039|ffffff
LB|LBN|Lebanon|A|52|ee161f|ffffff
LS|LES|Lesotho|F|42|00209f|009a44
LR|LBR|Liberia|F|46|002868|bf0a30
LY|LBY|Libya|F|54|e70013|000000
LI|LIE|Liechtenstein|E|38|002b7f|ce1126
LT|LTU|Lithuania|E|50|fdb913|006a44
LU|LUX|Luxembourg|E|56|ef3340|00a3e0
MG|MAD|Madagascar|F|52|fc3d32|007e3a
MW|MWI|Malawi|F|46|ce1126|000000
MY|MAS|Malaysia|A|52|ffcc00|000080
MV|MDV|Maldives|A|38|d21034|007e3a
ML|MLI|Mali|F|68|14b53a|fcd116
MT|MLT|Malta|E|44|cf142b|ffffff
MH|MHL|Marshall Islands|O|28|003893|dd7500
MR|MTN|Mauritania|F|54|00a95c|ffd700
MU|MRI|Mauritius|F|38|ea2839|1a206d
MX|MEX|Mexico|N|77|006847|ffffff
FM|FSM|Micronesia|O|28|75b2dd|ffffff
MD|MDA|Moldova|E|46|0046ae|ffd200
MC|MCO|Monaco|E|50|ce1126|ffffff
MN|MNG|Mongolia|A|36|c4272f|015197
ME|MNE|Montenegro|E|60|c40308|d4af37
MA|MAR|Morocco|F|82|c1272d|006233
MZ|MOZ|Mozambique|F|52|d21034|000000
MM|MYA|Myanmar|A|42|fecb00|ea2839
NA|NAM|Namibia|F|50|d21034|003580
NR|NRU|Nauru|O|26|002b7f|ffc61e
NP|NEP|Nepal|A|40|dc143c|003893
NL|NED|Netherlands|E|85|ff6f00|ffffff
NZ|NZL|New Zealand|O|58|ffffff|000000
NI|NCA|Nicaragua|N|46|0067c6|ffffff
NE|NIG|Niger|F|48|e05206|0db02b
NG|NGA|Nigeria|F|74|008751|ffffff
MK|MKD|North Macedonia|E|60|d20000|ffe600
NO|NOR|Norway|E|76|ba0c2f|ffffff
OM|OMA|Oman|A|58|db161b|ffffff
PK|PAK|Pakistan|A|38|01411c|ffffff
PW|PLW|Palau|O|26|4aadd6|ffde00
PA|PAN|Panama|N|66|da121a|ffffff
PG|PNG|Papua New Guinea|O|36|ce1126|000000
PY|PAR|Paraguay|S|72|d52b1e|0038a8
PE|PER|Peru|S|68|ffffff|d91023
PH|PHI|Philippines|A|44|0038a8|ce1126
PL|POL|Poland|E|74|ffffff|dc143c
PT|POR|Portugal|E|86|c8102e|006600
QA|QAT|Qatar|A|62|8a1538|ffffff
KR|KOR|South Korea|A|76|e4002b|ffffff
RO|ROU|Romania|E|68|fcd116|002b7f
RU|RUS|Russia|E|70|ffffff|d52b1e
RW|RWA|Rwanda|F|48|00a1de|fad201
KN|SKN|Saint Kitts and Nevis|N|40|009e49|ce1126
LC|LCA|Saint Lucia|N|36|66ccff|fcd116
VC|VIN|Saint Vincent and the Grenadines|N|38|0072c6|fcd116
WS|SAM|Samoa|O|30|002b7f|ce1126
SM|SMR|San Marino|E|32|5eb6e4|ffffff
ST|STP|São Tomé and Príncipe|F|36|12ad2b|ffce00
SA|KSA|Saudi Arabia|A|64|ffffff|006c35
SN|SEN|Senegal|F|79|ffffff|00853f
RS|SRB|Serbia|E|73|c6363c|0c4076
SC|SEY|Seychelles|F|32|003f87|fcd856
SL|SLE|Sierra Leone|F|50|1eb53a|0072c6
SG|SIN|Singapore|A|44|ed2939|ffffff
SK|SVK|Slovakia|E|68|ffffff|0b4ea2
SI|SVN|Slovenia|E|67|ffffff|005da4
SB|SOL|Solomon Islands|O|40|0051ba|fcd116
SO|SOM|Somalia|F|32|4189dd|ffffff
ZA|RSA|South Africa|F|66|ffb612|007749
SS|SSD|South Sudan|F|38|078930|000000
ES|ESP|Spain|E|88|c60b1e|ffc400
LK|SRI|Sri Lanka|A|34|8d153a|ffb700
SD|SDN|Sudan|F|48|d21034|ffffff
SR|SUR|Suriname|N|52|377e3f|ffffff
SE|SWE|Sweden|E|72|fecc02|006aa7
CH|SUI|Switzerland|E|79|da291c|ffffff
SY|SYR|Syria|A|54|ce1126|ffffff
TJ|TJK|Tajikistan|A|52|cc0000|ffffff
TH|THA|Thailand|A|56|1e3a8a|ffffff
TL|TLS|Timor-Leste|A|30|dc241f|000000
TG|TOG|Togo|F|50|ffce00|006a4e
TO|TGA|Tonga|O|26|c10000|ffffff
TT|TRI|Trinidad and Tobago|N|52|ce1126|000000
TN|TUN|Tunisia|F|70|e70013|ffffff
TR|TUR|Türkiye|E|76|e30a17|ffffff
TM|TKM|Turkmenistan|A|48|00843d|ffffff
TV|TUV|Tuvalu|O|24|009fca|fed100
UG|UGA|Uganda|F|56|fcdc04|000000
UA|UKR|Ukraine|E|75|ffd500|005bbb
AE|UAE|United Arab Emirates|A|60|ffffff|ce1126
GB|GBR|United Kingdom|E|86|ffffff|012169
TZ|TAN|Tanzania|F|50|1eb53a|00a3dd
US|USA|United States|N|78|ffffff|0a3161
UY|URU|Uruguay|S|82|5cbfeb|000000
UZ|UZB|Uzbekistan|A|66|ffffff|0099b5
VU|VAN|Vanuatu|O|34|d21034|009543
VE|VEN|Venezuela|S|66|7b1e2b|ffffff
VN|VIE|Vietnam|A|52|da251d|ffff00
YE|YEM|Yemen|A|42|ce1126|ffffff
ZM|ZAM|Zambia|F|58|198a00|ef7d00
ZW|ZIM|Zimbabwe|F|52|ffd200|006400
`;

export const CONFEDERATIONS = {
  E: 'Europe',
  A: 'Asia',
  F: 'Africa',
  N: 'North & Central America',
  S: 'South America',
  O: 'Oceania',
};

export const COUNTRIES = RAW.trim()
  .split('\n')
  .map((line) => {
    const [iso, code, name, conf, rating, primary, secondary] = line.split('|');
    return { iso, code, name, conf, rating: Number(rating), primary: `#${primary}`, secondary: `#${secondary}` };
  });
