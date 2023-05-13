import eyeBlueIcon from "../assets/svg/eye_blue.js";
import downloadBlueIcon from "../assets/svg/download_blue.js";

export default (billUrl) => {
  // id replace by class to avoid multiple time same id in dom
  return `<div class="icon-actions">
      <div class="eye" data-testid="icon-eye" data-bill-url=${billUrl}>
      ${eyeBlueIcon}
      </div>
    </div>`;
};
