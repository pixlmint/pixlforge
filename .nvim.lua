vim.api.nvim_create_user_command('PasteClipboardImage', function()
    local cmd_check = "wl-paste --list-types"
    local handles = vim.fn.system(cmd_check)

    local outfile = 'public/img/'
    local assetfile = 'img/'

    local rel_path = vim.fn.expand('%:r')
    local file_ext = vim.fn.expand('%:e')

    if file_ext ~= 'md' then
        vim.notify("Attempted pasting image in " .. rel_path .. " which is not a markdwon file", vim.log.levels.WARN)
        return
    end

    if rel_path:match("^content") then
        rel_path = rel_path:gsub('^content/', '')
    end

    local outpath = vim.fn.getcwd() .. '/' .. outfile .. rel_path

    vim.system({ "mkdir", "-p", outpath }, function()
    end)

    local mime = handles:match("%w+/%w+")

    if mime == "image/png" or mime == "image/jpeg" then
        local ext = mime == "image/png" and ".png" or ".jpg"
        local filename = os.date("%Y-%m-%d_%H%M%S", os.time()) .. ext
        assetfile = assetfile .. rel_path .. '/' .. filename
        outfile = outpath .. "/" .. filename
        vim.fn.system("wl-paste > " .. outfile)

        if vim.fn.filereadable(outfile) == 0 then
            vim.notify("Failed to read image from clipboard", vim.log.levels.ERROR)
            return
        end

        local line = string.format('![pasted image](%s)', assetfile)
        local keys = vim.api.nvim_replace_termcodes('o' .. line .. '<ESC>', true, false, true)
        vim.api.nvim_feedkeys(keys, 'n', false)
    else
        vim.notify("No image found in clipboard", vim.log.levels.WARN)
    end
end, {})
