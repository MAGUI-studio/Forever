function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (sheet.getLastRow() === 0) {
      var headers = [
        "Data/Hora do Envio",
        "Nome do Convidado Principal",
        "WhatsApp / Telefone",
        "Presença Confirmada",
        "Qtd Acompanhantes",
        "Nomes dos Acompanhantes",
        "Restrições Alimentares",
        "Recado para os Noivos",
      ];
      sheet.appendRow(headers);

      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#2D3748");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    var timestamp = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");
    var fullName = data.fullName || "";
    var whatsapp = data.whatsapp || "";
    var attending = data.attending === "sim" ? "SIM ✅" : "NÃO ❌";

    var companionsList = "";
    var companionCount = 0;

    if (data.companions && Array.isArray(data.companions)) {
      var validNames = data.companions
        .map(function (c) {
          return c.name ? c.name.trim() : "";
        })
        .filter(function (name) {
          return name.length > 0;
        });

      companionCount = validNames.length;
      companionsList = validNames.join(", ");
    }

    var dietary = data.dietaryRestrictions || "Nenhuma";
    var message = data.message || "";

    sheet.appendRow([
      timestamp,
      fullName,
      whatsapp,
      attending,
      companionCount,
      companionsList,
      dietary,
      message,
    ]);

    for (var i = 1; i <= 8; i++) {
      sheet.autoResizeColumn(i);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Presença registrada com sucesso!" }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "online", message: "RSVP Google Sheets Web App está ativo!" }),
  ).setMimeType(ContentService.MimeType.JSON);
}
