<td class="right aligned">
    <div class="ui small basic icon buttons action-buttons">
        {% if clipboard is not empty and isAllowed('clipboard') %}
            <a class="ui button clipboard" data-clipboard-text="{{ clipboard }}" data-variation="basic"
               data-content="{{ t._('bt_ToolTipCopyPassword') }}">
                <i class="icons">
                    <i class="icon copy blue"></i>
                </i>
            </a>
        {% endif %}
        {% if edit is not empty and (isAllowed('edit') or isAllowed('modify'))  %}
            {{ link_to(edit ~ id, '<i class="icon edit blue"></i> ', "class": "ui button edit popuped", "data-content": t._('bt_ToolTipEdit')) }}
        {% endif %}
        {% if restore is not empty and isAllowed('restore') %}
            {{ link_to(restore ~ id, '<i class="icon cog blue"></i> ', "class": "ui button restore popuped", "data-content": t._('bt_ToolTipRestore')) }}
        {% endif %}
        {% if download is not empty and isAllowed('download') %}
            {{ link_to(download ~ id, '<i class="icon download blue"></i> ', "class": "ui button download popuped", "data-content": t._('bt_ToolTipDownload')) }}
        {% endif %}
        {% if delete is not empty and isAllowed('delete') %}
            {{ link_to(delete ~ id, '<i class="icon trash red"></i> ', "class": "ui button delete two-steps-delete popuped", "data-content":t._('bt_ToolTipDelete')) }}
        {% endif %}
    </div>
</td>