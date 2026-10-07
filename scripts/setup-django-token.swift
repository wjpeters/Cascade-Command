import AppKit
import Security
let host=ProcessInfo.processInfo.environment["DJANGO_GAMES_API_BASE_URL"].flatMap{URL(string:$0)?.host} ?? "riskstudio-fafnir.abibia.com"
let app=NSApplication.shared
app.setActivationPolicy(.accessory)
let alert=NSAlert()
alert.messageText="Cascade Command API-token"
alert.informativeText="Voer de door de backendbeheerder verstrekte token voor \(host) in. Deze wordt alleen in de lokale login-sleutelhanger opgeslagen, buiten iCloud."
let field=NSSecureTextField(frame:NSRect(x:0,y:0,width:380,height:24))
alert.accessoryView=field
alert.addButton(withTitle:"Bewaar lokaal")
alert.addButton(withTitle:"Annuleer")
app.activate(ignoringOtherApps:true)
guard alert.runModal() == .alertFirstButtonReturn else {exit(0)}
let token=field.stringValue
guard !token.isEmpty,!token.contains("\n"),!token.contains("\r"),let data=token.data(using:.utf8) else {fputs("Geen geldige token ingevoerd.\n",stderr);exit(1)}
let query:[String:Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:"wpos.cascade-command",kSecAttrAccount as String:host,kSecAttrSynchronizable as String:false]
var status=SecItemUpdate(query as CFDictionary,[kSecValueData as String:data] as CFDictionary)
if status == errSecItemNotFound {var item=query;item[kSecValueData as String]=data;item[kSecAttrAccessible as String]=kSecAttrAccessibleWhenUnlocked;status=SecItemAdd(item as CFDictionary,nil)}
guard status == errSecSuccess else {fputs("Token opslaan is niet gelukt (\(status)).\n",stderr);exit(1)}
print("API-token opgeslagen in de lokale login-sleutelhanger voor \(host).")
