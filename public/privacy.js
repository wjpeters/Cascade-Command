fetch('/api/meta',{cache:'no-store'}).then(response=>response.ok?response.json():null).then(meta=>{
  if(!meta)return;
  const django=meta.storageBackend==='django';
  document.getElementById('privacy-storage').textContent=django?'Opslag vindt plaats in de centrale Django-backend van RiskStudio. De gameserver controleert spelacties en geeft alleen het gecontroleerde resultaat en gesaneerde metadata door.':'Opslag vindt lokaal plaats in de lokale gamebestanden en online in de database van deze Sites-website.';
  document.getElementById('privacy-cleanup').textContent=django?'Volledige IP-adressen zijn maximaal 30 dagen zichtbaar en overige detailgegevens maximaal 90 dagen. Dagtotalen blijven bewaard. Fysieke verwijdering wordt door de backendbeheerder ingericht; de game start die opruiming niet automatisch.':'Volledige IP-adressen zijn maximaal 30 dagen zichtbaar, overige detailgegevens maximaal 90 dagen. Verlopen gegevens worden bij het volgende meet- of statistiekverzoek opgeruimd. Dagtotalen blijven bewaard.';
  const policy=meta.contact_requirements||{},contact=Object.values(policy).some(value=>value==='required'||value==='optional');
  document.getElementById('privacy-contact').hidden=!contact;
  document.getElementById('privacy-contact-days').textContent=String(policy.retention_days||90);
  document.getElementById('privacy-draw').hidden=meta.capabilities?.consolationDraw===false;
}).catch(()=>{});
