function chunkText(input, maxLength = 1900) {
  if (!input || input.length <= maxLength) {
    return [input];
  }

  const chunks = [];
  let remaining = input;

  while (remaining.length > maxLength) {
    let splitIndex = remaining.lastIndexOf('\n', maxLength);
    if (splitIndex < Math.floor(maxLength * 0.6)) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex < 1) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

module.exports = { chunkText };
