import { ApiResponse } from '../../utils/ApiResponse.js';
import { catchAsync } from '../../utils/catchAsync.js';
import Settings from '../../models/Settings.js';
export class SettingsController {
    static get = catchAsync(async (_req, res) => {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        ApiResponse.success(res, settings);
    });
    static update = catchAsync(async (req, res) => {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(req.body);
        }
        else {
            Object.assign(settings, req.body);
            await settings.save();
        }
        ApiResponse.success(res, settings, 'Settings updated');
    });
}
//# sourceMappingURL=settings.controller.js.map